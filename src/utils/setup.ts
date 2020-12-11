import { loadLightning } from './lightning'
import { sequelize, models } from '../models'
import { exec } from 'child_process'
import * as QRCode from 'qrcode'
import * as publicIp from 'public-ip'
import password from '../utils/password'
import * as path from 'path'
import { checkTag, checkCommitHash } from '../utils/gitinfo'
import * as fs from 'fs';
import { isClean } from './nodeinfo'

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env]

const USER_VERSION = 7

const setupDatabase = async () => {
  console.log('=> [db] starting setup...')
  await setVersion()
  try {
    await sequelize.sync()
    console.log("=> [db] done syncing")
  } catch (e) {
    // console.log("db sync failed", e)
  }
  await migrate()
  setupOwnerContact()
  console.log('=> [db] setup done')
}

async function setVersion() {
  try {
    await sequelize.query(`PRAGMA user_version = ${USER_VERSION}`)
  } catch (e) {
    console.log('=> setVersion failed', e)
  }
}

async function migrate() {

  addTableColumn('sphinx_chat_members', 'last_alias')

  addTableColumn('sphinx_chats', 'my_photo_url')
  addTableColumn('sphinx_chats', 'my_alias')

  addTableColumn('sphinx_messages', 'sender_pic')

  addTableColumn('sphinx_messages', 'network_type', 'INTEGER')

  addTableColumn('sphinx_chats', 'meta')

  addTableColumn('sphinx_contacts', 'tip_amount', 'BIGINT')

  addTableColumn('sphinx_contacts', 'last_active', 'DATETIME')

  try {
    await sequelize.query(`
    CREATE TABLE sphinx_chat_bots (
      id BIGINT NOT NULL PRIMARY KEY,
      chat_id BIGINT,
      bot_uuid TEXT,
      bot_type INT,
      bot_prefix TEXT,
      bot_maker_pubkey TEXT,
      msg_types TEXT,
      meta TEXT,
      price_per_use INT,
      created_at DATETIME,
      updated_at DATETIME
    )`)
  } catch (e) { }

  try {
    await sequelize.query(`CREATE UNIQUE INDEX chat_bot_index ON sphinx_chat_bots(chat_id, bot_uuid);`)
  } catch (e) { }

  addTableColumn('sphinx_bots', 'webhook')
  addTableColumn('sphinx_bots', 'uuid')
  addTableColumn('sphinx_bots', 'price_per_use', 'INT')

  try {
    await sequelize.query(`
    CREATE TABLE sphinx_bot_members (
      id BIGINT NOT NULL PRIMARY KEY,
      member_pubkey TEXT,
      tribe_uuid TEXT,
      msg_count BIGINT,
      created_at DATETIME,
      updated_at DATETIME
    )`)
  } catch (e) { }

  addTableColumn('sphinx_bot_members', 'bot_id')

  //////////

  try {
    await sequelize.query(`
    CREATE TABLE sphinx_bots (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      secret TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`)
  } catch (e) { }

  addTableColumn('sphinx_chats', 'app_url')
  addTableColumn('sphinx_chats', 'feed_url')

  try {
    await sequelize.query(`CREATE UNIQUE INDEX chat_member_index ON sphinx_chat_members(chat_id, contact_id);`)
  } catch (e) { }

  addTableColumn('sphinx_chats', 'private', 'BOOLEAN')
  addTableColumn('sphinx_chats', 'unlisted', 'BOOLEAN')
  addTableColumn('sphinx_chat_members', 'status', 'BIGINT')

  addTableColumn('sphinx_chats', 'seen', 'BOOLEAN')

  try {
    await sequelize.query(`CREATE INDEX idx_messages_sender ON sphinx_messages (sender);`)
  } catch (e) { }

  addTableColumn('sphinx_contacts', 'notification_sound')
  addTableColumn('sphinx_contacts', 'from_group', 'BOOLEAN')
  addTableColumn('sphinx_contacts', 'private_photo', 'BOOLEAN')

  addTableColumn('sphinx_chats', 'escrow_amount', 'BIGINT')
  addTableColumn('sphinx_chats', 'escrow_millis', 'BIGINT')

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

}

async function addTableColumn(table: string, column: string, type = 'TEXT') {
  try {
    await sequelize.query(`alter table ${table} add ${column} ${type}`)
  } catch (e) {
    //console.log('=> migrate failed',e)
  }
}

const setupOwnerContact = async () => {
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  if (!owner) {
    const lightning = await loadLightning()
    lightning.getInfo({}, async (err, info) => {
      if (err) {
        console.log('[db] error creating node owner due to lnd failure', err)
      } else {
        try {
          const one = await models.Contact.findOne({ where: { id: 1 } })
          if (!one) {
            const contact = await models.Contact.create({
              id: 1,
              publicKey: info.identity_pubkey,
              isOwner: true,
              authToken: null
            })
            console.log('[db] created node owner contact, id:', contact.id)
          }
        } catch (error) {
          console.log('[db] error creating owner contact', error)
        }
      }
    })
  }
}

const runMigrations = async () => {
  await new Promise((resolve, reject) => {
    const migrate: any = exec('node_modules/.bin/sequelize db:migrate',
      { env: process.env },
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

async function setupDone() {
  await printGitInfo()
  printQR()
}

async function printGitInfo() {
  const commitHash = await checkCommitHash()
  const tag = await checkTag()
  console.log(`=> Relay version: ${tag}, commit: ${commitHash}`)
}

async function printQR() {

  let public_ip

  const public_url = config.public_url
  if (public_url) public_ip = public_url

  if (!public_ip) {
    const ip = process.env.NODE_IP
    if (!ip) {
      try {
        public_ip = await publicIp.v4()
      } catch (e) { }
    } else {
      public_ip = ip
    }
  }
  if (!public_ip) {
    console.log('=> no public IP provided')
    return
  }
  let theIP = public_ip
  // if(!theIP.includes(":")) theIP = public_ip+':3001'

  const b64 = Buffer.from(`ip::${theIP}::${password || ''}`).toString('base64')
  console.log('>>', b64)
  connectionStringFile(b64)

  const clean = await isClean()
  if (!clean) return // skip it if already setup!

  console.log('Scan this QR in Sphinx app:')
  QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
    console.log(url)
  })
}

function connectionStringFile(str: string) {
  fs.writeFile('connection_string.txt', str, function (err) {
    if (err) console.log('ERROR SAVING connection_string.txt.', err);
  });
}