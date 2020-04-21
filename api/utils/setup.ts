import { loadLightning } from './lightning'
import {sequelize, models} from '../models'
import { exec } from 'child_process'
import * as QRCode from 'qrcode'
import * as publicIp from 'public-ip'
import password from '../utils/password'

const USER_VERSION = 1

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
  try {
    await sequelize.query(`alter table sphinx_invites add invoice text`)
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

export { setupDatabase, setupOwnerContact, runMigrations, printQR }

async function printQR(){
  const ip = process.env.NODE_IP
  let public_ip
  if(!ip) {
    try {
      public_ip = await publicIp.v4()
    } catch(e){
      console.log(e)
    }
  } else {
    public_ip = ip
  }
  if(!public_ip) {
    console.log('=> no public IP provided')
    return
  }

  const pwd = password||''
  console.log('use password?',process.env.USE_PASSWORD)

  const b64 = Buffer.from(`ip::${public_ip}::${pwd}`).toString('base64')
  console.log('=>', b64)
  console.log('Scan this QR in Sphinx app:')
  QRCode.toString(b64,{type:'terminal'}, function (err, url) {
    console.log(url)
  })
}