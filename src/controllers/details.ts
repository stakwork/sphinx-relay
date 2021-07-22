import * as Lightning from '../grpc/lightning'
import { success, failure } from '../utils/res'
import * as readLastLines from 'read-last-lines'
import { nodeinfo } from '../utils/nodeinfo'
import constants from '../constants'
import { models } from '../models'
import { loadConfig } from '../utils/config'
import { getAppVersionsFromHub } from '../hub'
import { Op } from 'sequelize'

const config = loadConfig()

const VERSION = 2
export async function getRelayVersion(req, res) {
  success(res, { version: VERSION })
}

export async function getAppVersions(req, res) {
  const vs = await getAppVersionsFromHub()
  if (vs) {
    success(res, vs)
  } else {
    failure(res, 'Could not load app versions')
  }
}

export const checkRoute = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')

  const { pubkey, amount, route_hint } = req.query
  if (!(pubkey && pubkey.length === 66)) return failure(res, 'wrong pubkey')

  const owner = req.owner
  try {
    const amt = parseInt(amount) || constants.min_sat_amount
    const r = await Lightning.queryRoute(
      pubkey,
      amt,
      route_hint || '',
      owner.publicKey
    )
    success(res, r)
  } catch (e) {
    failure(res, e)
  }
}

export const checkRouteByContactOrChat = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')

  const chatID = req.query.chat_id
  const contactID = req.query.contact_id
  if (!chatID && !contactID) return failure(res, 'no chat_id or contact_id')

  let pubkey = ''
  let routeHint = ''
  if (contactID) {
    const contactId = parseInt(contactID)
    const contact = await models.Contact.findOne({ where: { id: contactId } })
    if (!contact) return failure(res, 'cant find contact')
    pubkey = contact.publicKey
    routeHint = contact.routeHint
  } else if (chatID) {
    const chatId = parseInt(chatID)
    const chat = await models.Chat.findOne({ where: { id: chatId } })
    if (!chat) return failure(res, 'cant find chat')
    if (!chat.ownerPubkey) return failure(res, 'cant find owern_pubkey')
    pubkey = chat.ownerPubkey
    const chatowner = await models.Contact.findOne({
      where: { publicKey: chat.ownerPubkey },
    })
    if (!chatowner) return failure(res, 'cant find chat owner')
    if (chatowner.routeHint) routeHint = chatowner.routeHint
  }

  if (!(pubkey && pubkey.length === 66)) return failure(res, 'wrong pubkey')

  const amount = req.query.amount
  const owner = req.owner
  try {
    const amt = parseInt(amount) || constants.min_sat_amount
    const r = await Lightning.queryRoute(
      pubkey,
      amt,
      routeHint || '',
      owner.publicKey
    )
    success(res, r)
  } catch (e) {
    failure(res, e)
  }
}

const defaultLogFiles = [
  '/var/log/supervisor/relay.log',
  '/home/lnd/.pm2/logs/app-error.log',
  '/var/log/syslog',
]
export async function getLogsSince(req, res) {
  const logFiles = config.log_file ? [config.log_file] : defaultLogFiles
  let txt
  let err
  await asyncForEach(logFiles, async (filepath) => {
    if (!txt) {
      try {
        const lines = await readLastLines.read(filepath, 500)
        if (lines) {
          var linesArray = lines.split('\n')
          linesArray.reverse()
          txt = linesArray.join('\n')
        }
      } catch (e) {
        err = e
      }
    }
  })
  if (txt) success(res, txt)
  else failure(res, err)
}

export const getLightningInfo = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')

  res.status(200)
  try {
    const response = await Lightning.getInfo()
    res.json({ success: true, response })
  } catch (e) {
    res.json({ success: false })
  }
  res.end()
}

export const getChannels = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')

  res.status(200)
  try {
    const response = await Lightning.listChannels({})
    res.json({ success: true, response })
  } catch (err) {
    res.json({ success: false })
  }
  res.end()
}

export const getBalance = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  var date = new Date()
  date.setMilliseconds(0)
  const owner = await models.Contact.findOne({ where: { id: tenant } })
  owner.update({ lastActive: date })

  res.status(200)
  try {
    const blcs = await Lightning.complexBalances(owner.publicKey)
    res.json({
      success: true,
      response: blcs,
    })
  } catch (e) {
    console.log('ERROR getBalance', e)
    res.json({ success: false })
  }
  res.end()
}

export const getLocalRemoteBalance = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  res.status(200)
  try {
    const channelList = await Lightning.listChannels({})
    const { channels } = channelList

    const localBalances: number[] = channels.map((c) =>
      parseInt(c.local_balance)
    )
    const remoteBalances: number[] = channels.map((c) =>
      parseInt(c.remote_balance)
    )
    const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0)
    const totalRemoteBalance = remoteBalances.reduce((a, b) => a + b, 0)
    res.json({
      success: true,
      response: {
        local_balance: totalLocalBalance,
        remote_balance: totalRemoteBalance,
      },
    })
  } catch (err) {
    res.json({ success: false })
  }
  res.end()
}

export const getNodeInfo = async (req, res) => {
  var ipOfSource = req.connection.remoteAddress
  if (!(ipOfSource.includes('127.0.0.1') || ipOfSource.includes('localhost'))) {
    res.status(401)
    res.end()
    return
  }
  const node = await nodeinfo()
  res.status(200)
  res.json(node)
  res.end()
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export async function clearForTesting(req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  if (!config.allow_test_clearing) {
    return failure(res, 'nope')
  }
  if (config.allow_test_clearing !== 'true') {
    return failure(res, 'nope')
  }

  try {
    await models.Chat.destroy({ truncate: true, where: { tenant } })
    await models.Subscription.destroy({ truncate: true, where: { tenant } })
    await models.Accounting.destroy({ truncate: true, where: { tenant } })
    await models.Bot.destroy({ truncate: true, where: { tenant } })
    await models.BotMember.destroy({ truncate: true, where: { tenant } })
    await models.ChatBot.destroy({ truncate: true, where: { tenant } })
    await models.Invite.destroy({ truncate: true, where: { tenant } })
    await models.MediaKey.destroy({ truncate: true, where: { tenant } })
    await models.Message.destroy({ truncate: true, where: { tenant } })
    await models.Timer.destroy({ truncate: true, where: { tenant } })
    await models.Contact.destroy({
      where: {
        isOwner: { [Op.ne]: true },
        tenant,
      },
    })
    const me = await models.Contact.findOne({
      where: { isOwner: true, tenant },
    })
    await me.update({
      authToken: '',
      photoUrl: '',
      contactKey: '',
      alias: '',
      deviceId: '',
    })
    success(res, { clean: true })
  } catch (e) {
    failure(res, e)
  }
}
