import * as Lightning from '../grpc/lightning'
import { sequelize, models, Contact } from '../models'
import { exec } from 'child_process'
import * as QRCode from 'qrcode'
import * as gitinfo from '../utils/gitinfo'
import * as fs from 'fs'
import { isClean } from './nodeinfo'
import { getQR } from './connect'
import { loadConfig } from './config'
import migrate from './migrate'
import { isProxy } from '../utils/proxy'
import { logging, sphinxLogger } from '../utils/logger'

const USER_VERSION = 7
const config = loadConfig()

const setupDatabase = async () => {
  sphinxLogger.info('starting setup', logging.DB)
  await setVersion()
  sphinxLogger.info('sync now', logging.DB)
  try {
    await sequelize.sync()
    sphinxLogger.info('done syncing', logging.DB)
  } catch (e) {
    sphinxLogger.info(['sync failed', e], logging.DB)
  }
  await migrate()
  sphinxLogger.info('setup done', logging.DB)
}

async function setVersion() {
  try {
    await sequelize.query(`PRAGMA user_version = ${USER_VERSION}`)
  } catch (e) {
    sphinxLogger.error('setVersion failed', logging.DB)
  }
}

const setupOwnerContact = async () => {
  const owner = await models.Contact.findOne({
    where: { isOwner: true, id: 1 },
  })
  if (!owner) {
    try {
      const info = await Lightning.getInfo()
      const one = await models.Contact.findOne({
        where: { isOwner: true, id: 1 },
      })
      if (!one) {
        let authToken: string | null = null
        let tenant: number | null = null
        // dont allow "signup" on root contact of proxy node
        if (isProxy()) {
          authToken = '_'
        } else {
          tenant = 1 // add tenant here
        }
        const contact: Contact = (await models.Contact.create({
          id: 1,
          publicKey: info.identity_pubkey,
          isOwner: true,
          authToken,
          tenant,
        })) as Contact
        sphinxLogger.info(
          ['created node owner contact, id:', contact.id],
          logging.DB
        )
      }
    } catch (err) {
      sphinxLogger.info(
        ['error creating node owner due to lnd failure', err],
        logging.DB
      )
    }
  }
}

const runMigrations = async () => {
  await new Promise((resolve, reject) => {
    const migration: any = exec(
      'node_modules/.bin/sequelize db:migrate',
      { env: process.env },
      (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      }
    )

    // Forward stdout+stderr to this process
    migration.stdout.pipe(process.stdout)
    migration.stderr.pipe(process.stderr)
  })
}

export { setupDatabase, setupOwnerContact, runMigrations, setupDone }

async function setupDone() {
  await printGitInfo()
  printQR()
}

async function printGitInfo() {
  sphinxLogger.info(
    `=> Relay version: ${gitinfo.tag}, commit: ${gitinfo.commitHash}`
  )
}

async function printQR() {
  const b64 = await getQR()
  if (!b64) {
    sphinxLogger.info('=> no public IP provided')
    return ''
  }

  sphinxLogger.info(['>>', b64])
  connectionStringFile(b64)

  const clean = await isClean()
  if (!clean) return // skip it if already setup!

  sphinxLogger.info('Scan this QR in Sphinx app:')
  QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
    sphinxLogger.info(url)
  })
}

function connectionStringFile(str: string) {
  let connectStringPath = 'connection_string.txt'
  if ('connection_string_path' in config) {
    connectStringPath = config.connection_string_path
  }
  fs.writeFile(
    connectStringPath || 'connection_string.txt',
    str,
    function (err) {
      if (err) sphinxLogger.error(['ERROR SAVING connection_string.txt.', err])
    }
  )
}
