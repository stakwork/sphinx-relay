import lock from '../utils/lock'
import { models, Chat, Message, Contact } from '../models'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as network from '../network'
import constants from '../constants'
import { success, failure200, failure } from '../utils/res'
import { logging, sphinxLogger } from '../utils/logger'
import { Req } from '../types'

/* 
 if in tribe: dont send
 UNLESS tribe admin: 
   then send only to the og sender
*/
export function sendConfirmation({
  chat,
  sender,
  msg_id,
  receiver,
}: {
  chat: any
  sender: any
  msg_id: number
  receiver?: any
}) {
  if (!msg_id || !chat || !sender) return

  let theChat = chat
  const isTribe = chat.type === constants.chat_types.tribe
  const isTribeOwner =
    isTribe && (sender && sender.publicKey) === (chat && chat.ownerPubkey)
  if (isTribe && !isTribeOwner) return // DONT SEND IF NORMAL MEMBER
  if (isTribeOwner && receiver && receiver.id) {
    theChat = { ...(chat.dataValues || chat), contactIds: [receiver.id] }
  }
  network.sendMessage({
    chat: theChat,
    sender,
    message: { id: msg_id },
    type: constants.message_types.confirmation,
  })
}

export async function receiveConfirmation(payload: network.Payload) {
  sphinxLogger.info(
    `=> received confirmation ${payload.message && payload.message.id}`,
    logging.Network
  )

  const dat = payload
  const chat_uuid = dat.chat.uuid
  const msg_id = dat.message.id
  const sender_pub_key = dat.sender.pub_key
  const owner = dat.owner
  const tenant: number = owner.id

  const sender: Contact = (await models.Contact.findOne({
    where: { publicKey: sender_pub_key, tenant },
  })) as Contact
  const chat: Chat = (await models.Chat.findOne({
    where: { uuid: chat_uuid, tenant },
  })) as Chat

  // new confirmation logic
  if (msg_id) {
    lock.acquire('confirmation', async function (done) {
      // console.log("update status map")
      const message: Message = (await models.Message.findOne({
        where: { id: msg_id, tenant },
      })) as Message
      if (message) {
        let statusMap = {}
        try {
          statusMap = JSON.parse(message.statusMap || '{}')
        } catch (e) {
          //Leave empty we want to do nothing here
        }
        statusMap[sender.id] = constants.statuses.received

        await message.update({
          status: constants.statuses.received,
          statusMap: JSON.stringify(statusMap),
        })
        socket.sendJson(
          {
            type: 'confirmation',
            response: jsonUtils.messageToJson(message, chat, sender),
          },
          tenant
        )
      }
      done()
    })
  } else {
    // old logic
    const messages: Message[] = (await models.Message.findAll({
      limit: 1,
      where: {
        chatId: chat.id,
        sender: owner.id,
        type: [
          constants.message_types.message,
          constants.message_types.invoice,
          constants.message_types.attachment,
        ],
        status: constants.statuses.pending,
        tenant,
      },
      order: [['createdAt', 'desc']],
    })) as Message[]

    const message = messages[0]
    message.update({ status: constants.statuses.received })

    socket.sendJson(
      {
        type: 'confirmation',
        response: jsonUtils.messageToJson(message, chat, sender),
      },
      tenant
    )
  }
}

export async function tribeOwnerAutoConfirmation(msg_id, chat_uuid, tenant) {
  if (!msg_id || !chat_uuid) return
  const message: Message = (await models.Message.findOne({
    where: { id: msg_id, tenant },
  })) as Message
  const chat: Chat = (await models.Chat.findOne({
    where: { uuid: chat_uuid, tenant },
  })) as Chat

  if (message) {
    let statusMap = {}
    try {
      statusMap = JSON.parse(message.statusMap || '{}')
    } catch (e) {
      //we want to do nothing here
    }
    statusMap['chat'] = constants.statuses.received

    await message.update({
      status: constants.statuses.received,
      statusMap: JSON.stringify(statusMap),
    })
    socket.sendJson(
      {
        type: 'confirmation',
        response: jsonUtils.messageToJson(message, chat, null),
      },
      tenant
    )
  }
}

export async function receiveHeartbeat(payload: network.Payload) {
  sphinxLogger.info(`=> received heartbeat`, logging.Network)

  const dat = payload
  const sender_pub_key = dat.sender.pub_key
  const sender_route_hint = dat.sender.route_hint
  const receivedAmount = dat.message.amount
  const owner = dat.owner
  // const tenant:number = owner.id

  if (!(sender_pub_key && sender_pub_key.length === 66))
    return sphinxLogger.error(`no sender`)
  if (!receivedAmount) return sphinxLogger.error(`no amount`)

  const amount = Math.round(receivedAmount / 2)
  const amt = Math.max(amount || constants.min_sat_amount)
  const opts = {
    amt,
    dest: sender_pub_key,
    route_hint: sender_route_hint || '',
    data: <network.Msg>{
      type: constants.message_types.heartbeat_confirmation,
      message: { amount: amt },
      sender: { pub_key: owner.publicKey },
    },
  }
  try {
    await network.signAndSend(opts, owner)
    return true
  } catch (e) {
    return false
  }
}

const heartbeats: { [k: string]: boolean } = {}
export async function healthcheck(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  // const tenant:number = req.owner.id

  const pubkey: string = req.query.pubkey as string
  if (!(pubkey && pubkey.length === 66)) {
    return failure200(res, 'missing pubkey')
  }
  const routeHint: string = req.query.route_hint as string

  const owner = req.owner

  const amt = 10
  const opts = {
    amt,
    dest: pubkey,
    route_hint: routeHint || '',
    data: <network.Msg>{
      type: constants.message_types.heartbeat,
      message: {
        amount: amt,
      },
      sender: { pub_key: owner.publicKey },
    },
  }
  try {
    await network.signAndSend(opts, owner)
  } catch (e) {
    failure200(res, e)
    return
  }

  let i = 0
  const interval = setInterval(() => {
    if (i >= 15) {
      clearInterval(interval)
      delete heartbeats[pubkey]
      failure200(res, 'no confimration received')
      return
    }
    if (heartbeats[pubkey]) {
      success(res, 'success')
      clearInterval(interval)
      delete heartbeats[pubkey]
      return
    }
    i++
  }, 1000)
}

export async function receiveHeartbeatConfirmation(payload: network.Payload) {
  sphinxLogger.info(`=> received heartbeat confirmation`, logging.Network)

  const dat = payload
  const sender_pub_key = dat.sender.pub_key

  heartbeats[sender_pub_key] = true
}
