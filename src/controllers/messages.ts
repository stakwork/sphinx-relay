import { Op, FindOptions } from 'sequelize'
import { indexBy } from 'underscore'
import * as short from 'short-uuid'
import { CronJob } from 'cron'
import {
  models,
  Message,
  Chat,
  ContactRecord,
  MessageRecord,
  ChatRecord,
} from '../models'
import {
  sendNotification,
  resetNotifyTribeCount,
  sendVoipNotification,
} from '../hub'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import { failure, success } from '../utils/res'
import * as timers from '../utils/timers'
import * as network from '../network'
import { Payload } from '../network'
import type { SendMessageParams } from '../network'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import { Req, Res } from '../types'
import { ChatPlusMembers } from '../network/send'
import { getCacheMsg } from '../utils/tribes'
import { loadConfig } from '../utils/config'
import { onReceiveReversal } from '../utils/reversal'
import { errMsgString } from '../utils/errMsgString'
import { sendConfirmation } from './confirmations'

interface ExtentedMessage extends Message {
  chat_id?: number
}

// store all current running jobs in memory
const jobs = {}

const config = loadConfig()

export const getMessageByUuid = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const uuid = req.params.uuid
  if (!uuid) return failure(res, 'no uuid supplied')
  const message: Message = (await models.Message.findOne({
    where: { tenant, uuid },
  })) as Message
  success(res, {
    message: jsonUtils.messageToJson(message),
  })
}

// deprecated
export const getMessages = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const dateToReturn = req.query.date

  if (!dateToReturn) {
    return getAllMessages(req, res)
  }

  sphinxLogger.info(dateToReturn, logging.Express)

  const owner = req.owner
  // const chatId = req.query.chat_id

  const newMessagesWhere = {
    date: { [Op.gte]: dateToReturn },
    [Op.or]: [{ receiver: owner.id }, { receiver: null }],
    tenant,
  }

  const confirmedMessagesWhere = {
    updated_at: { [Op.gte]: dateToReturn },
    status: {
      [Op.or]: [constants.statuses.received],
    },
    sender: owner.id,
    tenant,
  }

  const deletedMessagesWhere = {
    updated_at: { [Op.gte]: dateToReturn },
    status: {
      [Op.or]: [constants.statuses.deleted],
    },
    tenant,
  }

  // if (chatId) {
  // 	newMessagesWhere.chat_id = chatId
  // 	confirmedMessagesWhere.chat_id = chatId
  // }

  const newMessages: Message[] = (await models.Message.findAll({
    where: newMessagesWhere,
  })) as Message[]
  const confirmedMessages: Message[] = (await models.Message.findAll({
    where: confirmedMessagesWhere,
  })) as Message[]
  const deletedMessages: Message[] = (await models.Message.findAll({
    where: deletedMessagesWhere,
  })) as Message[]

  const chatIds: number[] = []
  newMessages.forEach((m) => {
    if (!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
  })
  confirmedMessages.forEach((m) => {
    if (!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
  })
  deletedMessages.forEach((m) => {
    if (!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
  })

  const chats: Chat[] =
    chatIds.length > 0
      ? ((await models.Chat.findAll({
          where: { deleted: false, id: chatIds, tenant },
        })) as Chat[])
      : []
  const chatsById = indexBy(chats, 'id')

  res.json({
    success: true,
    response: {
      new_messages: newMessages.map((message) =>
        jsonUtils.messageToJson(message, chatsById[message.chatId])
      ),
      confirmed_messages: confirmedMessages.map((message) =>
        jsonUtils.messageToJson(message, chatsById[message.chatId])
      ),
      deleted_messages: deletedMessages.map((message) =>
        jsonUtils.messageToJson(message, chatsById[message.chatId])
      ),
    },
  })
  res.status(200)
  res.end()
}

/**
@async
@function getAllMessages
@param {Req} req - The request object
@param {Res} res - The response object
@returns {Promise<void>}
@description This function retrieves all messages for the current owner, along with metadata about the messages, such as the associated chat ID and the total number of messages.
*/
export const getAllMessages = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 1000
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0
  let order = 'asc'
  if (req.query.order && req.query.order === 'desc') {
    order = 'desc'
  }

  sphinxLogger.info(
    `=> getAllMessages, limit: ${limit}, offset: ${offset}`,
    logging.Express
  )

  const clause: FindOptions = {
    order: [['id', order]],
    where: { tenant },
  }
  const all_messages_length: number = (await models.Message.count(
    clause
  )) as number
  if (limit) {
    clause.limit = limit
    clause.offset = offset
  }
  const messages: Message[] = (await models.Message.findAll(
    clause
  )) as Message[]

  sphinxLogger.info(
    `=> got msgs, ${messages && messages.length}`,
    logging.Express
  )

  const chats: Chat[] = (await models.Chat.findAll({
    where: { deleted: false, tenant },
  })) as Chat[]

  // Get Cache Messages
  const checkCache = helpers.checkCache()
  const allMsg = checkCache
    ? await getFromCache({
        chats,
        order,
        offset,
        limit,
        messages,
        all_messages_length,
      })
    : { messages, all_messages_length }

  // console.log("=> found all chats", chats && chats.length);
  const chatsById = indexBy(chats, 'id')
  // console.log("=> indexed chats");
  success(res, {
    new_messages: allMsg.messages.map((message) =>
      jsonUtils.messageToJson(message, chatsById[message.chatId])
    ),
    new_messages_total: allMsg.all_messages_length,
    confirmed_messages: [],
  })
}

/**
@function
@async
@param {Req} req - Express request object.
@param {Res} res - Express response object.
@returns {Promise<void>}
@description
This route handler is used to retrieve new messages. It accepts two optional query parameters: limit and offset
to limit the number of messages returned, and date to retrieve messages updated after the specified date.
The response contains the new_messages array, which is an array of new messages, and the new_messages_total
property, which indicates the total number of new messages.
*/
export const getMsgs = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const limit = req.query.limit && parseInt(req.query.limit as string)
  const offset = req.query.offset && parseInt(req.query.offset as string)
  const dateToReturn = req.query.date as string
  if (!dateToReturn) {
    return getAllMessages(req, res)
  }

  sphinxLogger.info(
    `=> getMsgs, limit: ${limit}, offset: ${offset}`,
    logging.Express
  )

  let order = 'asc'
  if (req.query.order && req.query.order === 'desc') {
    order = 'desc'
  }
  const clause: { [k: string]: any } = {
    order: [['id', order]],
    where: {
      updated_at: { [Op.gte]: dateToReturn },
      tenant,
    },
  }
  const numberOfNewMessages: number = (await models.Message.count(
    clause
  )) as number
  if (limit) {
    clause.limit = limit
    clause.offset = offset
  }
  const messages: Message[] = (await models.Message.findAll(
    clause
  )) as Message[]
  sphinxLogger.info(
    `=> got msgs, ${messages && messages.length}`,
    logging.Express
  )

  const chats: Chat[] = (await models.Chat.findAll({
    where: { deleted: false, tenant },
  })) as Chat[]

  //Check Cache
  const checkCache = helpers.checkCache()
  const allMsg = checkCache
    ? await getFromCache({
        chats,
        order,
        offset,
        limit,
        messages,
        all_messages_length: numberOfNewMessages,
        dateToReturn,
      })
    : { messages, all_messages_length: numberOfNewMessages }

  const chatsById = indexBy(chats, 'id')
  success(res, {
    new_messages: allMsg.messages.map((message) =>
      jsonUtils.messageToJson(message, chatsById[message.chatId])
    ),
    new_messages_total: allMsg.all_messages_length,
  })
}

/**
Deletes a message from the database and sends a delete message to the chat.
@param {Req} req - The request object containing the owner and params.
@param {Res} res - The response object to send the result.
@returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
*/
export async function deleteMessage(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const id = parseInt(req.params.id)

  const message: Message = (await models.Message.findOne({
    where: { id, tenant },
  })) as Message
  const uuid = message.uuid
  await message.update({ status: constants.statuses.deleted })

  const chat_id = message.chatId
  let chat
  if (chat_id) {
    chat = await models.Chat.findOne({ where: { id: chat_id, tenant } })
  }
  success(res, jsonUtils.messageToJson(message, chat))

  if (!chat) {
    return failure(res, 'no Chat')
  }
  const isTribe = chat.type === constants.chat_types.tribe

  const owner = req.owner
  const isTribeOwner = isTribe && owner.publicKey === chat.ownerPubkey

  if (isTribeOwner) {
    timers.removeTimerByMsgId(uuid)
  }
  network.sendMessage({
    chat: chat,
    sender: owner,
    type: constants.message_types.delete,
    message: { id, uuid },
  })
}

/**
send a message to a contact or tribe

@param {Req} req - request object
@param {Res} res - response object

@return {Promise<void>}
*/
export const sendMessage = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  // try {
  // 	schemas.message.validateSync(req.body)
  // } catch(e) {
  // 	return failure(res, e.message)
  // }
  const {
    contact_id,
    text,
    remote_text,
    chat_id,
    remote_text_map,
    amount,
    reply_uuid,
    boost,
    message_price,
    parent_id,
    pay,
    call,
    thread_uuid,
  } = req.body

  let msgtype = constants.message_types.message
  if (boost) msgtype = constants.message_types.boost
  if (pay) msgtype = constants.message_types.direct_payment
  if (call) msgtype = constants.message_types.call
  let boostOrPay = false
  if (boost || pay) boostOrPay = true

  const date = new Date()
  date.setMilliseconds(0)

  const owner = req.owner
  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id,
  })
  if (!chat) return failure(res, 'counldnt findOrCreateChat')

  let realSatsContactId
  let recipientAlias
  let recipientPic
  // IF BOOST NEED TO SEND ACTUAL SATS TO OG POSTER
  if (!chat) {
    return failure(res, 'no Chat')
  }
  const isTribe = chat.type === constants.chat_types.tribe
  const isTribeOwner = isTribe && owner.publicKey === chat.ownerPubkey
  if (reply_uuid && boostOrPay && amount) {
    const ogMsg: Message = (await models.Message.findOne({
      where: {
        uuid: reply_uuid,
        tenant,
      },
    })) as Message
    if (ogMsg && ogMsg.sender) {
      realSatsContactId = ogMsg.sender
      if (pay) {
        recipientAlias = ogMsg.senderAlias
        recipientPic = ogMsg.senderPic
      }
    }
  }

  const hasRealAmount = amount && amount > constants.min_sat_amount

  const remoteMessageContent = remote_text_map
    ? JSON.stringify(remote_text_map)
    : remote_text
  const uuid = short.generate()
  let amtToStore = amount || 0
  if (
    boostOrPay &&
    message_price &&
    typeof message_price === 'number' &&
    amount &&
    message_price < amount
  ) {
    amtToStore = amount - message_price
  }
  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: uuid,
    type: msgtype,
    sender: owner.id,
    amount: amtToStore,
    date: date,
    messageContent: text,
    remoteMessageContent,
    status: constants.statuses.pending,
    createdAt: date,
    updatedAt: date,
    network_type:
      !isTribe || hasRealAmount || realSatsContactId
        ? constants.network_types.lightning
        : constants.network_types.mqtt,
    tenant,
  }
  // "pay" someone who sent a msg is not a reply
  if (reply_uuid && !pay) msg.replyUuid = reply_uuid
  if (parent_id) msg.parentId = parent_id
  if (thread_uuid) msg.thread_uuid = thread_uuid
  if (recipientAlias) msg.recipientAlias = recipientAlias
  if (recipientPic) msg.recipientPic = recipientPic
  // console.log(msg)
  const message: Message = (await models.Message.create(msg)) as Message

  const msgToSend: { [k: string]: string | number } = {
    id: message.id,
    uuid: message.uuid,
    content: remote_text_map || remote_text || text,
    amount: amtToStore,
  }
  // even if its a "pay" send the reply_uuid so admin can forward
  if (reply_uuid) {
    // unless YOU are admin, then there is no forwarding
    if (!(isTribeOwner && pay)) {
      msgToSend.replyUuid = reply_uuid
    }
  }
  if (parent_id) msgToSend.parentId = parent_id
  if (thread_uuid) msgToSend.thread_uuid = thread_uuid
  if (recipientAlias) msgToSend.recipientAlias = recipientAlias
  if (recipientPic) msgToSend.recipientPic = recipientPic

  const sendMessageParams: SendMessageParams = {
    chat: chat as Partial<ChatPlusMembers>,
    sender: owner,
    amount: amount || 0,
    type: msgtype,
    message: msgToSend,
    success: function () {
      success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: async function (error) {
      const errMsg = errMsgString(error)
      await message.update({
        status: constants.statuses.failed,
        errorMessage: errMsg,
      })
      res.status(400)
      res.json({
        success: false,
        error: errMsg,
        response: jsonUtils.messageToJson(message, chat),
      })
      res.end()
    },
  }
  if (isTribeOwner && realSatsContactId) {
    sendMessageParams.realSatsContactId = realSatsContactId
    // tribe owner deducts the "price per message + escrow amount"
    if (amtToStore) {
      sendMessageParams.amount = amtToStore
    }
  }

  // final send
  // console.log('==> FINAL SEND MSG PARAMS', sendMessageParams)
  await network.sendMessage(sendMessageParams)
}

/**
Receive a message and store it in the database.

@param {Payload} payload - The message payload containing the sender, chat, and message content.
@returns {Promise<void>} - A promise that resolves when the message has been received and stored.
*/
export const receiveMessage = async (payload: Payload): Promise<void> => {
  const {
    owner,
    sender,
    chat,
    content,
    remote_content,
    msg_id,
    chat_type,
    sender_alias,
    msg_uuid,
    date_string,
    reply_uuid,
    parent_id,
    amount,
    network_type,
    sender_photo_url,
    message_status,
    force_push,
    hasForwardedSats,
    person,
    cached,
    thread_uuid,
  } = await helpers.parseReceiveParams(payload)

  if (!owner || !sender || !chat) {
    return sphinxLogger.info('=> no group chat!')
  }
  sphinxLogger.info(`received message on tenant ${owner.id} chat ${chat.id}`)

  const tenant: number = owner.id
  const text = content || ''

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  const msg: { [k: string]: string | number | Date | boolean } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.message,
    sender: sender.id,
    date: date,
    amount: amount || 0,
    messageContent: text,
    createdAt: date,
    updatedAt: date,
    status: message_status || constants.statuses.received,
    network_type: network_type,
    tenant,
    forwardedSats: hasForwardedSats,
    push: force_push ? true : false,
  }
  const isTribe = chat_type === constants.chat_types.tribe
  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
    msg.person = person
    if (remote_content) msg.remoteMessageContent = remote_content
  }
  if (reply_uuid) msg.replyUuid = reply_uuid
  if (thread_uuid) msg.thread_uuid = thread_uuid
  if (parent_id) msg.parentId = parent_id
  let message: Message | null = null

  if (!cached) {
    message = (await models.Message.create(msg)) as Message
  }

  socket.sendJson(
    {
      type: 'message',
      response: jsonUtils.messageToJson(message || msg, chat, sender),
    },
    tenant
  )

  sendNotification(
    chat,
    (msg.senderAlias || sender.alias) as string,
    'message',
    owner,
    undefined,
    force_push
  )

  if (!cached) {
    sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
  }
}

/**
Receives a boost message and stores it in the database.
@param {Payload} payload - The boost message payload.
@return {Promise<void>} - A promise that resolves when the function completes.
*/
export const receiveBoost = async (payload: Payload): Promise<void> => {
  const {
    owner,
    sender,
    chat,
    content,
    remote_content,
    chat_type,
    sender_alias,
    msg_uuid,
    date_string,
    reply_uuid,
    parent_id,
    amount,
    network_type,
    sender_photo_url,
    msg_id,
    force_push,
    hasForwardedSats,
    cached,
    thread_uuid,
  } = await helpers.parseReceiveParams(payload)

  sphinxLogger.info(
    `=> received boost ${amount} sats on network: ${network_type}`,
    logging.Network
  )
  if (!owner || !sender || !chat) {
    return sphinxLogger.error('=> no group chat!')
  }
  const tenant: number = owner.id
  const text = content

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  if (payload.error_message) {
    return await onReceiveReversal({
      tenant,
      type: 'boost',
      errorMsg: payload.error_message,
      msgUuid: payload.message.uuid,
      chat,
      sender,
    })
  }

  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.boost,
    sender: sender.id,
    date: date,
    amount: amount || 0,
    messageContent: text,
    createdAt: date,
    updatedAt: date,
    status: constants.statuses.received,
    network_type,
    tenant,
    forwardedSats: hasForwardedSats,
  }
  const isTribe = chat_type === constants.chat_types.tribe

  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
    if (remote_content) msg.remoteMessageContent = remote_content
  }
  if (reply_uuid) msg.replyUuid = reply_uuid
  if (thread_uuid) msg.thread_uuid = thread_uuid
  if (parent_id) msg.parentId = parent_id
  let message: Message | null = null
  if (!cached) {
    message = (await models.Message.create(msg)) as Message
  }

  socket.sendJson(
    {
      type: 'boost',
      response: jsonUtils.messageToJson(message || msg, chat, sender),
    },
    tenant
  )
  if (!cached) {
    sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
  }

  if (msg.replyUuid) {
    const ogMsg: Message = (await models.Message.findOne({
      where: { uuid: msg.replyUuid as string, tenant },
    })) as Message
    if (ogMsg && ogMsg.sender === tenant) {
      sendNotification(
        chat,
        (msg.senderAlias || sender.alias) as string,
        'boost',
        owner,
        undefined,
        force_push
      )
    }
  }
}

/**
Handles the receipt of a repayment.

@param {Payload} payload - The parsed payload of the incoming message.
@returns {Promise<void>} - A promise that resolves when the receipt of the repayment has been processed.
*/
export const receiveRepayment = async (payload: Payload): Promise<void> => {
  const { owner, sender, chat, date_string, amount, network_type } =
    await helpers.parseReceiveParams(payload)

  sphinxLogger.info(`=> received repayment ${amount}sats`, logging.Network)
  if (!owner || !sender || !chat) {
    return sphinxLogger.error('=> no group chat!')
  }
  const tenant = owner.id

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  const message: Message = (await models.Message.create({
    // chatId: chat.id,
    type: constants.message_types.repayment,
    sender: sender.id,
    date: date,
    amount: amount || 0,
    createdAt: date,
    updatedAt: date,
    status: constants.statuses.received,
    network_type,
    tenant,
  })) as Message

  socket.sendJson(
    {
      type: 'repayment',
      response: jsonUtils.messageToJson(message, null, sender),
    },
    tenant
  )
}

/**
@async
@function receiveDeleteMessage
@param {Payload} payload - The payload object containing information about the deleted message.
@returns {Promise<void>}
@example
receiveDeleteMessage(payload)
*/
export const receiveDeleteMessage = async (payload: Payload): Promise<void> => {
  sphinxLogger.info('=> received delete message', logging.Network)
  const { owner, sender, chat, chat_type, msg_uuid } =
    await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return sphinxLogger.error('=> no group chat!')
  }
  const tenant = owner.id

  const isTribe = chat_type === constants.chat_types.tribe
  // in tribe this is already validated on admin's node
  const where: { [k: string]: string | number } = { uuid: msg_uuid, tenant }
  if (!isTribe) {
    where.sender = sender.id // validate sender
  }
  const message: Message = (await models.Message.findOne({ where })) as Message
  if (!message) return

  await message.update({ status: constants.statuses.deleted })
  socket.sendJson(
    {
      type: 'delete',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )
}

/**
Updates the messages in the specified chat to mark them as seen by the owner and sends a notification to the other chat members.

@param {Req} req - The request object containing the chat ID.
@param {Res} res - The response object used to send the updated chat information.
@returns {Promise<void>} - An empty promise.
*/
export const readMessages = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')

  const chat_id = req.params.chat_id
  const owner = req.owner
  const tenant: number = owner.id

  await models.Message.update(
    { seen: true },
    {
      where: {
        sender: {
          [Op.ne]: owner.id,
        },
        chatId: chat_id,
        [Op.or]: [{ seen: false }, { seen: null }],
        tenant,
      },
    }
  )
  const chat: Chat = (await models.Chat.findOne({
    where: { id: chat_id, tenant },
  })) as Chat
  if (chat) {
    resetNotifyTribeCount(parseInt(chat_id))
    await chat.update({ seen: true })
    success(res, {})
    sendNotification(chat, '', 'badge', owner)
    socket.sendJson(
      {
        type: 'chat_seen',
        response: jsonUtils.chatToJson(chat),
      },
      tenant
    )
  } else {
    failure(res, 'no chat')
  }
}

/**
This function will clear all messages in the database.

@param {Req} req - The request object containing the owner property.
@param {Res} res - The response object.
@returns {Promise<void>} - This function returns a promise that resolves to an empty object on success, or a failure message on failure.
*/
export const clearMessages = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  await models.Message.destroy({ where: { tenant }, truncate: true })

  success(res, {})
}

export async function disappearingMessages(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const contacts = (await models.Contact.findAll({
      where: { tenant, isOwner: true },
    })) as ContactRecord[]
    await deleteMessages(contacts)
    return success(res, 'Messages deleted successfully')
  } catch (error) {
    return failure(res, error)
  }
}

export const receiveVoip = async (payload: Payload): Promise<void> => {
  sphinxLogger.info(`received Voip ${payload}`)
  const {
    owner,
    sender,
    chat,
    content,
    msg_id,
    chat_type,
    sender_alias,
    msg_uuid,
    date_string,
    reply_uuid,
    parent_id,
    amount,
    network_type,
    sender_photo_url,
    message_status,
    hasForwardedSats,
    person,
    remote_content,
    thread_uuid,
  } = await helpers.parseReceiveParams(payload)

  if (!owner || !sender || !chat) {
    return sphinxLogger.info('=> invalid message')
  }
  const tenant: number = owner.id
  const text = content

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.call,
    sender: sender.id,
    date: date,
    amount: amount || 0,
    messageContent: text,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
    forwardedSats: hasForwardedSats,
    status: message_status || constants.statuses.received,
  }
  const isTribe = chat_type === constants.chat_types.tribe
  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
    if (remote_content) msg.remoteMessageContent = remote_content
    msg.person = person
  }
  if (reply_uuid) msg.replyUuid = reply_uuid
  if (thread_uuid) msg.thread_uuid = thread_uuid
  if (parent_id) msg.parentId = parent_id
  const message: Message = (await models.Message.create(msg)) as Message

  socket.sendJson(
    {
      type: 'call',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )
  sendVoipNotification(owner, { caller_name: sender.alias, link_url: text })

  sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
}
interface GetCacheInput {
  chats: Chat[]
  order: string
  offset: number | '' | undefined
  limit: number | '' | undefined
  messages: Message[]
  all_messages_length: number
  dateToReturn?: string
}
async function getFromCache({
  chats,
  order,
  offset,
  limit,
  messages,
  all_messages_length,
  dateToReturn,
}: GetCacheInput) {
  for (let i = 0; i < chats.length; i++) {
    const chat = chats[i]
    if (chat.preview) {
      const cacheMsg = await getCacheMsg({
        preview: chat.preview,
        chat_uuid: chat.uuid,
        chat_id: chat.id,
        order,
        offset,
        limit,
        dateToReturn,
      })
      messages = [...messages, ...cacheMsg]
      all_messages_length = all_messages_length + cacheMsg.length
    }
  }
  return removeDuplicateMsg(messages, all_messages_length)
}

function removeDuplicateMsg(
  messages: ExtentedMessage[],
  message_length: number
) {
  const filteredMsg: ExtentedMessage[] = []
  const uuidObject: { [k: string]: ExtentedMessage } = {}
  let all_message_length = message_length
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    const alreadyStoredMsg = uuidObject[message.uuid]
    if (
      helpers.checkMsgTypeInCache(message.type) &&
      alreadyStoredMsg &&
      !alreadyStoredMsg.chat_id
    ) {
      const msgIndex = filteredMsg.findIndex(
        (msg) => msg.uuid === alreadyStoredMsg.uuid
      )
      filteredMsg.splice(msgIndex, 1)
      all_message_length -= 1
      filteredMsg.push(message)
      uuidObject[message.uuid] = message
    } else {
      filteredMsg.push(message)
      uuidObject[message.uuid] = message
    }
  }

  return { messages: filteredMsg, all_messages_length: all_message_length }
}

export const initializeDeleteMessageCronJobs = async () => {
  try {
    if (config.default_prune) {
      sphinxLogger.info(['=> initializing delete message cron job'])
      const contacts = (await models.Contact.findAll({
        where: { isOwner: true },
      })) as ContactRecord[]
      startDeleteMsgCronJob(contacts)
    }
  } catch (error) {
    sphinxLogger.error(['=> error initializing delete message cron job', error])
  }
}

async function startDeleteMsgCronJob(contacts: ContactRecord[]) {
  jobs['del_msg'] = new CronJob(
    '0 5 * * *',
    () => {
      deleteMessages(contacts)
    },
    null,
    true
  )
}

async function deleteMessages(contacts: ContactRecord[]) {
  try {
    for (let i = 0; i < contacts.length; i++) {
      const contact: ContactRecord = contacts[i]
      const date = new Date()
      date.setDate(
        date.getDate() - (contact.prune || parseInt(config.default_prune || 0))
      )
      await handleMessageDelete({
        tenant: contact.tenant,
        date: date.toISOString(),
      })
    }
  } catch (error) {
    sphinxLogger.error([
      '=> error iterating through contacts to delete message cron job',
      error,
    ])
  }
}

async function handleMessageDelete({
  tenant,
  date,
}: {
  tenant: number
  date: string
}) {
  try {
    const chats = (await models.Chat.findAll({
      where: { tenant, deleted: false },
    })) as ChatRecord[]

    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i]
      const chatMessages = (await models.Message.findAll({
        where: { chatId: chat.id, tenant },
      })) as MessageRecord[]
      if (chatMessages.length > 10) {
        const tenthToLastID = chatMessages[chatMessages.length - 10]
        await models.Message.destroy({
          where: {
            id: { [Op.lt]: tenthToLastID.id },
            createdAt: { [Op.lt]: date },
            chatId: chat.id,
            tenant,
          },
        })
      }
    }
    sphinxLogger.info(['=> message deleted by cron job'])
  } catch (error) {
    sphinxLogger.error(['=> error deleting message by cron job', error])
  }
}
