import { loadLightning } from './lightning'
import {sequelize, models} from '../models'
import { exec } from 'child_process'
import * as QRCode from 'qrcode'
import * as publicIp from 'public-ip'
import password from '../utils/password'
import {checkTag, checkCommitHash} from '../utils/gitinfo'

const USER_VERSION = 6

const setupDatabase = async () => {
  console.log('=> [db] starting setup...')
  await setVersion()
  try {
    await sequelize.sync()
    console.log("=> [db] done syncing")
  } catch(e) {
    console.log("db sync failed",e)
  }
  await migrate()
  setupOwnerContact()
  console.log('=> [db] setup done')
}

async function setVersion(){
  try {
    await sequelize.query(`PRAGMA user_version = ${USER_VERSION}`)
  } catch(e) {
    console.log('=> setVersion failed',e)
  }
}

async function migrate(){

  try{
    await sequelize.query(`
    CREATE TABLE sphinx_bots (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      chat_id BIGINT,
      secret TEXT
    )`)
  } catch(e){}

  addTableColumn('sphinx_chats', 'app_url')

  try{
    await sequelize.query(`CREATE UNIQUE INDEX chat_member_index ON sphinx_chat_members(chat_id, contact_id);`)
  }catch(e){}
  

  addTableColumn('sphinx_chats', 'private', 'BOOLEAN')
  addTableColumn('sphinx_chats', 'unlisted', 'BOOLEAN')
  addTableColumn('sphinx_chat_members', 'status', 'BIGINT')

  addTableColumn('sphinx_chats', 'seen', 'BOOLEAN')

  try{
    await sequelize.query(`CREATE INDEX idx_messages_sender ON sphinx_messages (sender);`)
  }catch(e){}

  addTableColumn('sphinx_contacts', 'notification_sound')

//   try{
//     await sequelize.query(`
// CREATE TABLE sphinx_timers (
//   id BIGINT,
//   chat_id BIGINT,
//   receiver BIGINT,
//   millis BIGINT,
//   msg_id BIGINT,
//   amount DECIMAL
// )`)
//   } catch(e){}
//   addTableColumn('sphinx_chats', 'escrow_amount', 'BIGINT')
//   addTableColumn('sphinx_chats', 'escrow_millis', 'BIGINT')
  
//   addTableColumn('sphinx_contacts', 'private_photo', 'BOOLEAN')
}

async function addTableColumn(table:string, column:string, type='TEXT') {
  try {
    await sequelize.query(`alter table ${table} add ${column} ${type}`)
  } catch(e) {
    //console.log('=> migrate failed',e)
  }
}

const setupOwnerContact = async () => {
  const owner = await models.Contact.findOne({ where: { isOwner: true }})
  if (!owner) {
    const lightning = await loadLightning()
    lightning.getInfo({}, async (err, info) => {
      if (err) {
        console.log('[db] error creating node owner due to lnd failure', err)
      } else {
        try {
          const one = await models.Contact.findOne({ where: { id: 1 }})
          if(!one){
            const contact = await models.Contact.create({
              id: 1,
              publicKey: info.identity_pubkey,
              isOwner: true,
              authToken: null
            })
            console.log('[db] created node owner contact, id:', contact.id)
          }          
        } catch(error) {
          console.log('[db] error creating owner contact', error)
        }
      }
    })
  }
}

const runMigrations = async () => {
  await new Promise((resolve, reject) => {
    const migrate: any = exec('node_modules/.bin/sequelize db:migrate',
      {env: process.env},
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );

    // Forward stdout+stderr to this process
    migrate.stdout.pipe(process.stdout);
    migrate.stderr.pipe(process.stderr);
  });
}

export { setupDatabase, setupOwnerContact, runMigrations, setupDone }

async function setupDone(){
  await printGitInfo()
  printQR()
}

async function printGitInfo(){
  const commitHash = await checkCommitHash()
  const tag = await checkTag()
  console.log(`=> Relay version: ${tag}, commit: ${commitHash}`)
}

async function printQR(){
  const ip = process.env.NODE_IP
  let public_ip
  if(!ip) {
    try {
      public_ip = await publicIp.v4()
    } catch(e){}
  } else {
    public_ip = ip
  }
  if(!public_ip) {
    console.log('=> no public IP provided')
    return
  }
  let theIP = public_ip
  // if(!theIP.includes(":")) theIP = public_ip+':3001'

  const b64 = Buffer.from(`ip::${theIP}::${password||''}`).toString('base64')
  console.log('Scan this QR in Sphinx app:')
  console.log(b64)
  QRCode.toString(b64,{type:'terminal'}, function (err, url) {
    console.log(url)
  })
}