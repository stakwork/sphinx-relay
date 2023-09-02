import { Op } from 'sequelize'
import * as bolt11 from '@boltz/bolt11'
import * as lndService from '../grpc/subscribe'
import * as Lightning from '../grpc/lightning'
import * as Greenlight from '../grpc/greenlight'
import * as interfaces from '../grpc/interfaces'
import { ACTIONS } from '../controllers'
import * as tribes from '../utils/tribes'
import * as signer from '../utils/signer'
import {
  models,
  ContactRecord,
  Contact,
  Message,
  Chat,
  ChatRecord,
  ChatMember,
  ChatMemberRecord,
  MessageRecord,
  ChatBotRecord,
} from '../models'
import { decryptMessage, encryptTribeBroadcast } from '../utils/msg'
import * as timers from '../utils/timers'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import constants from '../constants'
import * as jsonUtils from '../utils/json'
import { getProxyRootPubkey, isProxy } from '../utils/proxy'
import { loadConfig } from '../utils/config'
import { sphinxLogger, logging } from '../utils/logger'
import { findBot } from '../builtin/utill'
import { SpamGoneMeta } from '../types'
import {
  modifyPayloadAndSaveMediaKey,
  purchaseFromOriginalSender,
  sendFinalMemeIfFirstPurchaser,
} from './modify'
import { sendMessage, detectMentionsForTribeAdminSelf } from './send'
import { Payload, AdminPayload } from './interfaces'

const config = loadConfig()
/*
delete type:
owner needs to check that the delete is the one who made the msg
in receiveDeleteMessage check the deleter is og sender?
*/

const msgtypes = constants.message_types

export const typesToForward = [
  msgtypes.message,
  msgtypes.group_join,
  msgtypes.group_leave,
  msgtypes.attachment,
  msgtypes.delete,
  msgtypes.boost,
  msgtypes.direct_payment,
]
export const typesToSkipIfSkipBroadcastJoins = [
  msgtypes.group_join,
  msgtypes.group_leave,
]
const typesToModify = [msgtypes.attachment]
const typesThatNeedPricePerMessage = [
  msgtypes.message,
  msgtypes.attachment,
  msgtypes.boost,
  msgtypes.direct_payment,
]
export const typesToReplay = [
  // should match typesToForward
  msgtypes.message,
  msgtypes.group_join,
  msgtypes.group_leave,
  msgtypes.bot_res,
  msgtypes.boost,
  msgtypes.direct_payment,
]
const botTypes = [
  constants.message_types.bot_install,
  constants.message_types.bot_cmd,
  constants.message_types.bot_res,
]
const botMakerTypes = [
  constants.message_types.bot_install,
  constants.message_types.bot_cmd,
]
async function onReceive(payload: Payload, dest: string) {
  if (dest) {
    if (typeof dest !== 'string' || dest.length !== 66)
      return sphinxLogger.error(`INVALID DEST ${dest}`)
  }
  payload.dest = dest // add "dest" into payload

  // console.log('===> onReceive', JSON.stringify(payload, null, 2))
  if (!(payload.type || payload.type === 0))
    return sphinxLogger.error(`no payload.type`)

  const owner: ContactRecord = (await models.Contact.findOne({
    where: { isOwner: true, publicKey: dest },
  })) as ContactRecord
  if (!owner) return sphinxLogger.error(`=> RECEIVE: owner not found`)
  const tenant: number = owner.id

  // if tribe, owner must forward to MQTT
  let doAction = true
  const toAddIn: AdminPayload = {}
  let isTribe = false
  let isTribeOwner = false
  const ownerDataValues: Contact = owner.dataValues || owner

  let maybeChat: ChatRecord | undefined
  if (payload.chat && payload.chat.uuid) {
    isTribe = payload.chat.type === constants.chat_types.tribe
    maybeChat = (await models.Chat.findOne({
      where: { uuid: payload.chat.uuid, tenant },
    })) as ChatRecord
    if (maybeChat) maybeChat.update({ seen: false })
  }

  if (botTypes.includes(payload.type)) {
    // if is admin on tribe? or is bot maker?
    sphinxLogger.info(`=> got bot msg type!`)
    if (botMakerTypes.includes(payload.type)) {
      if (!payload.bot_uuid)
        return sphinxLogger.error(`bot maker type: no bot uuid`)
    }
    payload.owner = ownerDataValues
    return ACTIONS[payload.type](payload)
  }

  if (isTribe) {
    const tribeOwnerPubKey = maybeChat && maybeChat.ownerPubkey
    isTribeOwner = owner.publicKey === tribeOwnerPubKey
  }
  let forwardedFromContactId = 0
  if (isTribeOwner) {
    toAddIn.isTribeOwner = true
    const chat = maybeChat as ChatRecord
    if (typesToForward.includes(payload.type)) {
      const needsPricePerMessage = typesThatNeedPricePerMessage.includes(
        payload.type
      )

      // CHECK THEY ARE IN THE GROUP if message
      const senderContact: Contact = (await models.Contact.findOne({
        where: { publicKey: payload.sender.pub_key, tenant },
      })) as Contact

      let isSpam = false
      //Check if message is spam
      if (payload.type === constants.message_types.message) {
        isSpam = await checkSpamList(chat, senderContact)
        if (isSpam) {
          //to be changes to a new message type spam
          // payload.type = constants.message_types.delete

          //This is temporary, till the app has spam message type updated
          payload.message.content = ''
        }
      }

      // if (!senderContact) return console.log('=> no sender contact')

      const senderContactId = senderContact && senderContact.id
      forwardedFromContactId = senderContactId
      if (needsPricePerMessage && senderContactId) {
        const senderMember = await models.ChatMember.findOne({
          where: { contactId: senderContactId, chatId: chat.id, tenant },
        })
        if (!senderMember) doAction = false
      }
      // CHECK PRICES
      if (needsPricePerMessage) {
        if (payload.message.amount < chat.pricePerMessage) {
          doAction = false
        }
        if (chat.escrowAmount && senderContactId && !isSpam) {
          timers.addTimer({
            // pay them back
            amount: chat.escrowAmount,
            millis: chat.escrowMillis,
            receiver: senderContactId,
            msgId: payload.message.id,
            chatId: chat.id,
            tenant,
            msgUuid: payload.message.uuid,
          })
        }
      }
      // check price to join AND private chat
      if (payload.type === msgtypes.group_join) {
        if (payload.message.amount < chat.priceToJoin) {
          doAction = false
        }
        if (chat.private && senderContactId) {
          // check if has been approved
          const senderMember: ChatMember = (await models.ChatMember.findOne({
            where: { contactId: senderContactId, chatId: chat.id, tenant },
          })) as ChatMember
          if (
            !(
              senderMember &&
              senderMember.status === constants.chat_statuses.approved
            )
          ) {
            doAction = false // dont let if private and not approved
          }
        }
      }
      // check that the sender is the og poster
      if (payload.type === msgtypes.delete && senderContactId) {
        doAction = false
        if (payload.message.uuid) {
          const ogMsg = await models.Message.findOne({
            where: {
              uuid: payload.message.uuid,
              sender: senderContactId,
              tenant,
            },
          })
          if (ogMsg) doAction = true
        }
      }
      // forward boost sats to recipient
      let realSatsContactId: number | undefined = undefined
      let amtToForward = 0
      const boostOrPay =
        payload.type === msgtypes.boost ||
        payload.type === msgtypes.direct_payment
      if (boostOrPay && payload.message.replyUuid) {
        const ogMsg: Message = (await models.Message.findOne({
          where: {
            uuid: payload.message.replyUuid,
            tenant,
          },
        })) as Message
        if (ogMsg && ogMsg.sender) {
          // even include "me"
          const theAmtToForward =
            payload.message.amount -
            (chat.pricePerMessage || 0) -
            (chat.escrowAmount || 0)
          if (theAmtToForward > 0) {
            realSatsContactId = ogMsg.sender // recipient of sats
            amtToForward = theAmtToForward
            toAddIn.hasForwardedSats = ogMsg.sender !== tenant
            if (amtToForward && payload.message && payload.message.amount) {
              payload.message.amount = amtToForward // mutate the payload amount
              if (payload.type === msgtypes.direct_payment) {
                // remove the reply_uuid since its not actually a reply
                payload.message.replyUuid = undefined
              }
            }
          }
        }
      }
      // make sure alias is unique among chat members
      payload = await uniqueifyAlias(payload, senderContact, chat, owner)
      if (doAction) {
        try {
          const sender = (await models.ChatMember.findOne({
            where: {
              contactId: senderContactId,
              tenant,
              chatId: chat.id,
            },
          })) as ChatMemberRecord
          if (sender && !isSpam) {
            await sender.update({ totalMessages: sender.totalMessages + 1 })
            if (payload.type === msgtypes.message) {
              const allMsg = (await models.Message.findAll({
                limit: 1,
                order: [['createdAt', 'DESC']],
                where: {
                  chatId: chat.id,
                  type: { [Op.ne]: msgtypes.confirmation },
                },
              })) as MessageRecord[]
              const contact = (await models.Contact.findOne({
                where: { publicKey: payload.sender.pub_key, tenant },
              })) as ContactRecord
              if (allMsg.length === 0 || allMsg[0].sender !== contact.id) {
                await sender.update({
                  totalSpent: sender.totalSpent + payload.message.amount,
                  reputation: sender.reputation + 1,
                })
              }
            } else if (payload.type === msgtypes.boost) {
              await sender.update({
                totalSpent: sender.totalSpent + payload.message.amount,
                reputation: sender.reputation + 2,
              })
            } else {
              await sender.update({
                totalSpent: sender.totalSpent + payload.message.amount,
              })
            }
          }
        } catch (error) {
          sphinxLogger.error(
            `=> Could not update the totalSpent column on the ChatMember table for Leadership board record ${error}`,
            logging.Network
          )
        }
        forwardMessageToTribe(
          payload,
          senderContact,
          realSatsContactId,
          amtToForward,
          owner,
          forwardedFromContactId
        )
      } else
        sphinxLogger.error(
          `=> insufficient payment for this action`,
          logging.Network
        )
    }
    if (payload.type === msgtypes.purchase) {
      const chat = maybeChat as ChatRecord
      const mt = payload.message.mediaToken
      const host = mt && mt.split('.').length && mt.split('.')[0]
      const muid = mt && mt.split('.').length && mt.split('.')[1]
      const myAttachmentMessage = await models.Message.findOne({
        where: {
          mediaToken: { [Op.like]: `${host}.${muid}%` },
          type: msgtypes.attachment,
          sender: tenant,
          tenant,
        },
      })
      if (!myAttachmentMessage) {
        // someone else's attachment
        const senderContact: Contact = (await models.Contact.findOne({
          where: { publicKey: payload.sender.pub_key, tenant },
        })) as Contact
        purchaseFromOriginalSender(payload, chat, senderContact, owner)
        doAction = false
      }
    }
    if (payload.type === msgtypes.purchase_accept) {
      const purchaserID = payload.message && payload.message.purchaser
      const iAmPurchaser = purchaserID && purchaserID === tenant
      if (!iAmPurchaser) {
        const senderContact: ContactRecord = (await models.Contact.findOne({
          where: { publicKey: payload.sender.pub_key, tenant },
        })) as ContactRecord
        sendFinalMemeIfFirstPurchaser(payload, chat, senderContact, owner)
        doAction = false // skip this! we dont need it
      }
    }
  }
  if (doAction) doTheAction({ ...payload, ...toAddIn }, ownerDataValues)
}

async function doTheAction(data: Payload, owner: Contact) {
  // console.log("=> doTheAction", data, owner)
  let payload = data
  if (payload.isTribeOwner) {
    // this is only for storing locally, my own messages as tribe owner
    // actual encryption for tribe happens in personalizeMessage
    const ogContent = data.message && data.message.content
    // const ogMediaKey = data.message && data.message.mediaKey
    /* decrypt and re-encrypt with phone's pubkey for storage */
    const chat: Chat = (await models.Chat.findOne({
      where: { uuid: payload.chat.uuid, tenant: owner.id },
    })) as Chat
    const pld = await decryptMessage(data, chat)
    const mentioned = await detectMentionsForTribeAdminSelf(
      pld,
      owner.alias,
      chat.myAlias
    )
    if (mentioned) pld.message.push = true
    const me = owner
    // encrypt for myself
    const encrypted = await encryptTribeBroadcast(pld, me, true) // true=isTribeOwner
    payload = encrypted as Payload
    if (ogContent)
      payload.message.remoteContent = JSON.stringify({ chat: ogContent }) // this is the key
    //if(ogMediaKey) payload.message.remoteMediaKey = JSON.stringify({'chat':ogMediaKey})
  }
  if (ACTIONS[payload.type]) {
    payload.owner = owner
    // console.log("ACTIONS!", ACTIONS[payload.type])
    ACTIONS[payload.type](payload)
  } else {
    sphinxLogger.error(`Incorrect payload type: ${payload.type}`)
  }
}

async function uniqueifyAlias(
  payload: Payload,
  sender,
  chat,
  owner
): Promise<Payload> {
  if (!chat || !sender || !owner) return payload
  if (!(payload && payload.sender)) return payload
  const senderContactId = sender.id // og msg sender

  const owner_alias = chat.myAlias || owner.alias
  const sender_alias = payload.sender && payload.sender.alias
  let final_sender_alias = sender_alias
  const chatMembers = await models.ChatMember.findAll({
    where: { chatId: chat.id, tenant: owner.id },
  })
  if (!(chatMembers && chatMembers.length)) return payload
  const ALL = 'all'
  asyncForEach(chatMembers, (cm) => {
    if (cm.contactId === senderContactId) return // dont check against self of course
    if (
      sender_alias === cm.lastAlias ||
      sender_alias === owner_alias ||
      sender_alias === ALL
    ) {
      // impersonating! switch it up!
      final_sender_alias = `${sender_alias}_2`
    }
  })

  const ww = { chatId: chat.id, contactId: senderContactId, tenant: owner.id }
  const oldMember = (await models.ChatMember.findOne({
    where: ww,
  })) as ChatMember
  if (oldMember) {
    if (oldMember.lastAlias !== final_sender_alias) {
      await models.ChatMember.update(
        // this syntax is necessary when no unique ID on the Model
        { lastAlias: final_sender_alias },
        { where: ww }
      )
    }
  } else {
    sphinxLogger.warning('member not found in uniquifyAlias')
  }

  payload.sender.alias = final_sender_alias
  return payload
}

async function forwardMessageToTribe(
  ogpayload: Payload,
  sender,
  realSatsContactId,
  amtToForwardToRealSatsContactId,
  owner,
  forwardedFromContactId
) {
  // console.log('forwardMessageToTribe', ogpayload.sender.person)
  const tenant = owner.id
  const chat: Chat = (await models.Chat.findOne({
    where: { uuid: ogpayload.chat.uuid, tenant },
  })) as Chat
  if (!chat) return

  if (chat.skipBroadcastJoins) {
    if (typesToSkipIfSkipBroadcastJoins.includes(ogpayload.type)) {
      return
    }
  }

  let payload: Payload
  if (sender && typesToModify.includes(ogpayload.type)) {
    payload = await modifyPayloadAndSaveMediaKey(ogpayload, chat, sender, owner)
  } else {
    payload = ogpayload
  }

  const type = payload.type
  const message = payload.message

  let personUuid = ''
  if (payload.sender && payload.sender.person) {
    const person_arr = payload.sender.person.split('/')
    if (person_arr.length > 1) {
      personUuid = person_arr[person_arr.length - 1]
    }
  }
  sendMessage({
    type,
    message,
    sender: {
      // the owner... but with og sender alias
      ...owner.dataValues,
      alias: (payload.sender && payload.sender.alias) || '',
      photoUrl: (payload.sender && payload.sender.photo_url) || '',
      role: constants.chat_roles.reader,
      personUuid,
    },
    amount: amtToForwardToRealSatsContactId || 0,
    chat: chat,
    skipPubKey: payload.sender.pub_key, // dont forward back to self
    realSatsContactId,
    isForwarded: true,
    forwardedFromContactId,
  })
}

export async function initGrpcSubscriptions(): Promise<void> {
  try {
    if (config.lightning_provider === 'GREENLIGHT') {
      await Greenlight.initGreenlight()
      Greenlight.keepalive()
    }
    const info = await Lightning.getInfo(true)
    console.log('===> subscribed invoices with pubkey:', info.identity_pubkey)
    await lndService.subscribeInvoices(parseKeysendInvoice)
  } catch (e) {
    console.log('=> initGrpcSubscriptions error', e)
    throw e
  }
}

export async function receiveMqttMessage(
  topic: string,
  message: Buffer
): Promise<void> {
  try {
    const msg = message.toString()
    // check topic is signed by sender?
    const payload = await parseAndVerifyPayload(msg)
    if (!payload) return // skip it if not parsed
    payload.network_type = constants.network_types.mqtt

    const arr = topic.split('/')
    const dest = arr[0]
    onReceive(payload, dest)
  } catch (e) {
    sphinxLogger.error('failed receiveMqttMessage', logging.Network)
  }
}

export async function receiveCoTenantMessage(
  destination: string,
  message: string
): Promise<void> {
  try {
    // check topic is signed by sender?
    const payload = await parseAndVerifyPayload(message)
    if (!payload) return // skip it if not parsed
    payload.network_type = constants.network_types.co_tenant
    onReceive(payload, destination)
  } catch (e) {
    sphinxLogger.error('failed receiveCoTenantMessage', logging.Network)
  }
}

export async function initTribesSubscriptions(): Promise<void> {
  tribes.connect(receiveMqttMessage)
}

function parsePayload(data): Payload {
  const li = data.lastIndexOf('}')
  const msg = data.substring(0, li + 1)
  const payload = JSON.parse(msg)
  return payload || ''
}

// VERIFY PUBKEY OF SENDER from sig
async function parseAndVerifyPayload(data): Promise<Payload | null> {
  let payload
  const li = data.lastIndexOf('}')
  const msg = data.substring(0, li + 1)
  const sig = data.substring(li + 1)
  try {
    payload = JSON.parse(msg)
    if (payload && payload.sender && payload.sender.pub_key) {
      let v
      // console.log("=> SIG LEN", sig.length)
      if (sig.length === 96 && payload.sender.pub_key) {
        v = await signer.verifyAscii(msg, sig, payload.sender.pub_key)
      }
      if (sig.length === 104) {
        v = await Lightning.verifyAscii(msg, sig)
      }
      if (v && v.valid) {
        return payload
      } else {
        return payload // => RM THIS
      }
    } else {
      sphinxLogger.error(`no sender.pub_key`)
      return null
    }
  } catch (e) {
    if (payload) return payload // => RM THIS
    return null
  }
}

async function saveAnonymousKeysend(inv, memo, sender_pubkey, tenant) {
  let sender = 0 // not required
  if (sender_pubkey) {
    const theSender: Contact = (await models.Contact.findOne({
      where: { publicKey: sender_pubkey, tenant },
    })) as Contact
    if (theSender && theSender.id) {
      sender = theSender.id
    }
  }
  const amount = (inv.value && parseInt(inv.value)) || 0
  const date = new Date()
  date.setMilliseconds(0)
  const msg = await models.Message.create({
    chatId: 0,
    type: constants.message_types.keysend,
    sender,
    amount,
    amountMsat: amount * 1000,
    paymentHash: '',
    date: date,
    messageContent: memo || '',
    status: constants.statuses.confirmed,
    createdAt: date,
    updatedAt: date,
    network_type: constants.network_types.lightning,
    tenant,
  })
  socket.sendJson(
    {
      type: 'keysend',
      response: jsonUtils.messageToJson(msg, null),
    },
    tenant
  )
}

const hashCache: { [k: string]: boolean } = {}

export async function parseKeysendInvoice(
  i: interfaces.Invoice
): Promise<void> {
  try {
    const hash = i.r_hash.toString('base64')
    if (hashCache[hash]) return
    hashCache[hash] = true
  } catch (e) {
    sphinxLogger.error('failed hash cache in parseKeysendInvoice')
  }

  const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records

  let dest = ''
  let owner
  if (isProxy()) {
    try {
      if (i.payment_request) {
        // child user
        const invoice = bolt11.decode(i.payment_request)
        if (!invoice.payeeNodeKey)
          return sphinxLogger.error(`cant get dest from pay req`)
        dest = invoice.payeeNodeKey
      } else {
        // root user
        dest = await getProxyRootPubkey()
      }
      owner = await models.Contact.findOne({
        where: { isOwner: true, publicKey: dest },
      })
    } catch (e) {
      sphinxLogger.error(`FAILURE TO DECODE PAY REQ ${e}`)
    }
  } else {
    // non-proxy, only one "owner"
    owner = await models.Contact.findOne({ where: { isOwner: true } })
    dest = owner.publicKey
  }
  if (!owner || !dest) {
    sphinxLogger.error(`=> parseKeysendInvoice ERROR: cant find owner`)
    return
  }

  const buf = recs && recs[Lightning.SPHINX_CUSTOM_RECORD_KEY]
  const data = buf && buf.toString()
  const value = i && i.value && parseInt(i.value)
  // console.log('===> ALL RECS', JSON.stringify(recs))

  // "keysend" type is NOT encrypted
  // and should be saved even if there is NO content
  let isKeysendType = false
  let memo = ''
  let sender_pubkey
  if (data) {
    try {
      const payload: Payload = parsePayload(data)
      if (payload && payload.type === constants.message_types.keysend) {
        // console.log('====> IS KEYSEND TYPE')
        // console.log('====> MEMOOOO', i.memo)
        isKeysendType = true
        memo = (payload.message && payload.message.content) as string
        sender_pubkey = payload.sender && payload.sender.pub_key
      }
    } catch (e) {
      sphinxLogger.error('failed parsePayload', logging.Network)
    } // err could be a threaded TLV
  } else {
    isKeysendType = true
  }
  if (isKeysendType) {
    if (!memo) {
      sendNotification(new Chat(), '', 'keysend', owner, value || 0)
    }
    saveAnonymousKeysend(i, memo, sender_pubkey, owner.id)
    return
  }

  let payload
  if (data[0] === '{') {
    try {
      payload = await parseAndVerifyPayload(data)
    } catch (e) {
      sphinxLogger.error('failed parseAndVerifyPayload', logging.Network)
    }
  } else {
    const threads = weave(data)
    if (threads) payload = await parseAndVerifyPayload(threads)
  }
  if (payload) {
    const dat = payload
    if (value && dat && dat.message) {
      dat.message.amount = value // ADD IN TRUE VALUE
    }
    dat.network_type = constants.network_types.lightning
    onReceive(dat, dest)
  }
}

const chunks = {}
function weave(p) {
  const pa = p.split('_')
  if (pa.length < 4) return
  const ts = pa[0]
  const i = pa[1]
  const n = pa[2]
  const m = pa.filter((u, i) => i > 2).join('_')
  chunks[ts] = chunks[ts] ? [...chunks[ts], { i, n, m }] : [{ i, n, m }]
  if (chunks[ts].length === parseInt(n)) {
    // got em all!
    const all = chunks[ts]
    let payload = ''
    all
      .slice()
      .sort((a, b) => a.i - b.i)
      .forEach((obj) => {
        payload += obj.m
      })
    delete chunks[ts]
    return payload
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function checkSpamList(
  chat: ChatRecord,
  contact: Contact
): Promise<boolean> {
  try {
    const bot: ChatBotRecord = await findBot({
      botPrefix: '/spam_gone',
      tribe: chat,
    })
    if (!bot) {
      return false
    }
    const meta: SpamGoneMeta = JSON.parse(bot.meta || `{}`)

    if (meta.pubkeys && meta.pubkeys.length > 0) {
      for (let i = 0; i < meta.pubkeys.length; i++) {
        if (meta.pubkeys[i].pubkey === contact.publicKey) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    return false
  }
}
