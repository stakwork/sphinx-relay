import * as Lightning from '../grpc/lightning'
import { sequelize, models } from '../models'
import { exec } from 'child_process'
import * as QRCode from 'qrcode'
import { checkTag, checkCommitHash } from '../utils/gitinfo'
import * as fs from 'fs';
import { isClean } from './nodeinfo'
import { getQR } from './connect'
import { loadConfig } from './config'
import migrate from './migrate'
import {isProxy} from '../utils/proxy'
import {logging} from '../utils/logger'

const USER_VERSION = 7
const config = loadConfig()

const setupDatabase = async () => {
  if(logging.DB) console.log('=> [db] starting setup...')
  await setVersion()
  if(logging.DB) console.log('=> [db] sync now')
  try {
    await sequelize.sync()
    if(logging.DB) console.log("=> [db] done syncing")
  } catch (e) {
    if(logging.DB) console.log("[db] sync failed", e)
  }
  await migrate()
  if(logging.DB) console.log('=> [db] setup done')
}

async function setVersion() {
  try {
    await sequelize.query(`PRAGMA user_version = ${USER_VERSION}`)
  } catch (e) {
    console.log('=> [db] setVersion failed')
  }
}

const setupOwnerContact = async () => {
  const owner = await models.Contact.findOne({ where: { isOwner: true, id:1 } })
  if (!owner) {
    try {
      const info = await Lightning.getInfo()
      const one = await models.Contact.findOne({ where: { isOwner:true, id: 1 } })
      if (!one) {
        let authToken:string|null = null
        let tenant:number|null = null
        // dont allow "signup" on root contact of proxy node
        if(isProxy()) {
          authToken = '_'
        } else {
          tenant = 1 // add tenant here
        }
        const contact = await models.Contact.create({
          id: 1,
          publicKey: info.identity_pubkey,
          isOwner: true,
          authToken,
          tenant
        })
        console.log('[db] created node owner contact, id:', contact.id)
      }
    } catch(err) {
      console.log('[db] error creating node owner due to lnd failure', err)
    }
  }
}

const runMigrations = async () => {
  await new Promise((resolve, reject) => {
    const migration: any = exec('node_modules/.bin/sequelize db:migrate',
      { env: process.env },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );

    // Forward stdout+stderr to this process
    migration.stdout.pipe(process.stdout);
    migration.stderr.pipe(process.stderr);
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

  const b64 = await getQR()
  if (!b64) {
    console.log('=> no public IP provided')
    return ''
  }

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
  let connectStringPath = 'connection_string.txt'
  if ('connection_string_path' in config) {
    connectStringPath = config.connection_string_path
  }
  fs.writeFile(connectStringPath||'connection_string.txt', str, function (err) {
    if (err) console.log('ERROR SAVING connection_string.txt.', err);
  });
}