import * as Lightning from '../grpc/lightning'
import {
  sequelize,
  models,
  Contact,
  ContactRecord,
  Lsat,
  ChatMemberRecord,
} from '../models'
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
import fetch from 'node-fetch'
import { Op } from 'sequelize'
import constants from '../constants'

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

const setupPersonUuid = async () => {
  let protocol = 'https'
  if (config.tribes_insecure) protocol = 'http'

  try {
    const contacts = (await models.Contact.findAll({
      where: {
        isOwner: true,
        [Op.or]: [{ personUuid: null }, { personUuid: '' }],
      },
    })) as ContactRecord[]

    for (let i = 0; i < contacts.length; i++) {
      const tenant = contacts[i]
      const url =
        protocol + '://' + config.people_host + '/person/' + tenant.publicKey
      const res = await fetch(url)
      const person = await res.json()
      if (person.uuid) {
        await models.Contact.update(
          { personUuid: person.uuid },
          { where: { id: tenant.id } }
        )
      }
    }
  } catch (error) {
    console.log(error)
    sphinxLogger.info(['error trying to set person uuid', error], logging.DB)
  }
}

const updateLsat = async (): Promise<void> => {
  try {
    const timestamp = new Date(1669658385 * 1000)
    const lsats = (await models.Lsat.findAll({
      where: { createdAt: { [Op.lt]: timestamp }, status: 1 },
    })) as Lsat[]
    for (let i = 0; i < lsats.length; i++) {
      const lsat = lsats[i]
      lsat.update({ status: constants.lsat_statuses.expired })
    }
  } catch (error) {
    sphinxLogger.error(
      ['error trying to update lsat status', error],
      logging.Lsat
    )
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

const updateTotalMsgPerTribe = async () => {
  try {
    const result = (await sequelize.query(
      `
      SELECT * FROM sphinx_contacts
      INNER JOIN sphinx_chats
      ON sphinx_contacts.public_key = sphinx_chats.owner_pubkey
      INNER JOIN sphinx_chat_members
      ON sphinx_chats.id = sphinx_chat_members.chat_id
      WHERE sphinx_contacts.is_owner = 1`,
      {
        model: models.ChatMember,
        mapToModel: true, // pass true here if you have any mapped fields
      }
    )) as ChatMemberRecord[]

    if (result.length > 0 && result[0].totalMessages === null) {
      for (let i = 0; i < result.length; i++) {
        const member = result[i]
        const totalMessages = await models.Message.count({
          where: { sender: member.contactId, chatId: member.chatId },
        })
        await member.update({ totalMessages })
      }
    }
  } catch (error) {
    sphinxLogger.error(
      ['error trying to update Total Messages in Chat Member Table', error],
      logging.DB
    )
  }
}

export {
  setupDatabase,
  setupOwnerContact,
  runMigrations,
  setupDone,
  setupPersonUuid,
  updateLsat,
  updateTotalMsgPerTribe,
}

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
