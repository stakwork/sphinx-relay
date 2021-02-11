import { loadLightning } from './lightning'
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

const USER_VERSION = 7
const config = loadConfig()

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
  console.log('=> [db] setup done')
}

async function setVersion() {
  try {
    await sequelize.query(`PRAGMA user_version = ${USER_VERSION}`)
  } catch (e) {
    console.log('=> setVersion failed', e)
  }
}

const setupOwnerContact = async () => {
  const owner = await models.Contact.findOne({ where: { isOwner: true, id:1 } })
  if (!owner) {
    const lightning = await loadLightning()
    lightning.getInfo({}, async (err, info) => {
      if (err) {
        console.log('[db] error creating node owner due to lnd failure', err)
      } else {
        try {
          const one = await models.Contact.findOne({ where: { isOwner:true, id: 1 } })
          if (!one) {
            let authToken:string|null = null
            // dont allow "signup" on root contact of proxy node
            if(isProxy()) authToken = '_'
            const contact = await models.Contact.create({
              id: 1,
              publicKey: info.identity_pubkey,
              isOwner: true,
              authToken
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