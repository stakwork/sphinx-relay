import { Message, Chat, models } from '../models'
import { sendNotification } from '../hub'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import { failure, success } from '../utils/res'
import { tokenFromTerms } from '../utils/ldat'
import * as network from '../network'
import { Payload } from '../network'
import * as short from 'short-uuid'
import constants from '../constants'
import { Op } from 'sequelize'
import { anonymousKeysend } from './feed'
import { sphinxLogger } from '../utils/logger'
import { Req, Res } from '../types'
import { sendConfirmation } from './confirmations'

export const sendPayment = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const {
    amount,
    chat_id,
    contact_id,
    destination_key,
    route_hint,
    media_type,
    muid,
    text,
    remote_text,
    dimensions,
    remote_text_map,
    contact_ids,
    reply_uuid,
    parent_id,
  } = req.body

  sphinxLogger.info(`[send payment] ${req.body}`)

  const owner = req.owner

  if (destination_key && !contact_id && !chat_id) {
    anonymousKeysend(
      owner,
      destination_key,
      route_hint,
      amount || '',
      text || '',
      function (body) {
        success(res, body)
      },
      function (error) {
        res.status(200)
        res.json({ success: false, error })
        res.end()
      },
      {}
    )
    return
  }

  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id,
  })
  if (!chat) return failure(res, 'counldnt findOrCreateChat')

  const date = new Date()
  date.setMilliseconds(0)

  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: short.generate(),
    sender: owner.id,
    type: constants.message_types.direct_payment,
    status: constants.statuses.confirmed,
    amount: amount,
    amountMsat: parseFloat(amount) * 1000,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type: constants.network_types.lightning,
    tenant,
  }
  if (text) msg.messageContent = text
  if (remote_text) msg.remoteMessageContent = remote_text
  if (reply_uuid) msg.replyUuid = reply_uuid
  if (parent_id) msg.parentId = parent_id

  if (muid) {
    const myMediaToken = await tokenFromTerms({
      meta: { dim: dimensions },
      host: '',
      muid,
      ttl: null, // default one year
      pubkey: owner.publicKey,
      ownerPubkey: owner.publicKey,
    })
    msg.mediaToken = myMediaToken
    msg.mediaType = media_type || ''
  }

  const message: Message = await models.Message.create(msg)

  const msgToSend: { [k: string]: any } = {
    id: message.id,
    uuid: message.uuid,
    amount,
  }
  if (muid) {
    msgToSend.mediaType = media_type || 'image/jpeg'
    msgToSend.mediaTerms = { muid, meta: { dim: dimensions } }
  }
  if (remote_text) msgToSend.content = remote_text
  if (reply_uuid) msgToSend.replyUuid = reply_uuid
  if (parent_id) msgToSend.parentId = parent_id

  // if contact_ids, replace that in "chat" below
  // if remote text map, put that in
  let theChat = chat
  if (contact_ids) {
    theChat = { ...chat.dataValues, contactIds: contact_ids } as Chat
    if (remote_text_map) msgToSend.content = remote_text_map
  }
  network.sendMessage({
    chat: theChat,
    sender: owner,
    type: constants.message_types.direct_payment,
    message: msgToSend as Message,
    amount: amount,
    success: async () => {
      // console.log('payment sent', { data })
      success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: async () => {
      await message.update({ status: constants.statuses.failed })
      res.status(200)
      res.json({
        success: false,
        response: jsonUtils.messageToJson(message, chat),
      })
      res.end()
    },
  })
}

export const receivePayment = async (payload: Payload): Promise<void> => {
  sphinxLogger.info(`received payment ${{ payload }}`)

  const {
    owner,
    sender,
    chat,
    amount,
    content,
    mediaType,
    mediaToken,
    chat_type,
    sender_alias,
    msg_uuid,
    msg_id,
    parent_id,
    network_type,
    remote_content,
    sender_photo_url,
    date_string,
    recipient_alias,
    recipient_pic,
  } = await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return sphinxLogger.error(`=> no group chat!`)
  }
  const tenant: number = owner.id

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.direct_payment,
    status: constants.statuses.received,
    sender: sender.id,
    amount: amount,
    amountMsat: parseFloat(amount + '') * 1000,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  if (content) msg.messageContent = content
  if (mediaType) msg.mediaType = mediaType
  if (mediaToken) msg.mediaToken = mediaToken
  if (chat_type === constants.chat_types.tribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
    if (remote_content) msg.remoteMessageContent = remote_content
  }
  // direct_payment is never a reply (thats a boost)
  // if (reply_uuid) msg.replyUuid = reply_uuid
  if (parent_id) msg.parentId = parent_id
  if (recipient_alias) msg.recipientAlias = recipient_alias
  if (recipient_pic) msg.recipientPic = recipient_pic

  const message: Message = await models.Message.create(msg)

  // console.log('saved message', message.dataValues)

  socket.sendJson(
    {
      type: 'direct_payment',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )

  sendNotification(chat, msg.senderAlias || sender.alias, 'message', owner)

  sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
}

export const listPayments = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const limit = (req.query.limit && parseInt(req.query.limit.toString())) || 100
  const offset =
    (req.query.offset && parseInt(req.query.offset.toString())) || 0

  const MIN_VAL = constants.min_sat_amount
  try {
    const msgs: Message[] = await models.Message.findAll({
      where: {
        [Op.or]: [
          {
            type: {
              [Op.or]: [
                constants.message_types.payment,
                constants.message_types.keysend,
                constants.message_types.purchase,
              ],
            },
            status: { [Op.not]: constants.statuses.failed },
          },
          {
            type: {
              [Op.or]: [
                constants.message_types.message, // paid bot msgs, or price_per_message msgs
                constants.message_types.boost,
                constants.message_types.repayment,
                constants.message_types.direct_payment, // can be a payment in a tribe
              ],
            },
            amount: {
              [Op.gt]: MIN_VAL, // greater than
            },
            network_type: constants.network_types.lightning,
            status: { [Op.not]: constants.statuses.failed },
          },
        ],
        tenant,
      },
      order: [['createdAt', 'desc']],
      limit,
      offset,
    })
    const ret = msgs || []
    success(
      res,
      ret.map((message) => jsonUtils.messageToJson(message))
    )
  } catch (e) {
    failure(res, 'cant find payments')
  }
}
