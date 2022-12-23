import {
  models,
  Chat,
  ChatMember,
  ChatRecord,
  Contact,
  MediaKey,
  Message,
} from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import * as rsa from '../crypto/rsa'
import * as helpers from '../helpers'
import * as socket from '../utils/socket'
import * as tribes from '../utils/tribes'
import { sendNotification } from '../hub'
import { personalizeMessage, decryptMessage } from '../utils/msg'
import { Op } from 'sequelize'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import type { Tribe } from '../models/ts/tribe'
import { Req, Res } from '../types'

/**
 * @function joinTribe
 * @param {Req} req - The request object containing information about the request made to the server.
 * @param {Res} res - The response object used to send a response back to the client.
 *
 * @returns {Promise<void>} - A promise that resolves when the user has successfully joined the tribe, or rejects with an error if something goes wrong.
 */
export async function joinTribe(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  sphinxLogger.info('=> joinTribe', logging.Express)
  const {
    uuid,
    group_key,
    name,
    host,
    amount,
    img,
    owner_pubkey,
    owner_route_hint,
    owner_alias,
    my_alias,
    my_photo_url,
  } = req.body
  sphinxLogger.info(
    ['received owner route hint', owner_route_hint],
    logging.Express
  )
  const is_private = req.body.private ? true : false

  const existing: Chat = (await models.Chat.findOne({
    where: { uuid, tenant },
  })) as Chat
  if (existing) {
    sphinxLogger.error('You are already in this tribe', logging.Tribes)
    return failure(res, 'cant find tribe')
  }

  if (!owner_pubkey || !group_key || !uuid) {
    sphinxLogger.error('missing required params', logging.Tribes)
    return failure(res, 'missing required params')
  }

  const ownerPubKey = owner_pubkey
  // verify signature here?

  const tribeOwner: Contact = (await models.Contact.findOne({
    where: { publicKey: ownerPubKey, tenant },
  })) as Contact

  let theTribeOwner
  const owner = req.owner

  const contactIds = [owner.id]
  if (tribeOwner) {
    theTribeOwner = tribeOwner // might already include??
    if (tribeOwner.routeHint !== owner_route_hint) {
      await tribeOwner.update({ routeHint: owner_route_hint })
    }
    if (!contactIds.includes(tribeOwner.id)) contactIds.push(tribeOwner.id)
  } else {
    const createdContact: Contact = (await models.Contact.create({
      publicKey: ownerPubKey,
      contactKey: '',
      alias: owner_alias || 'Unknown',
      status: 1,
      fromGroup: true,
      tenant,
      routeHint: owner_route_hint || '',
    })) as Contact
    theTribeOwner = createdContact
    // console.log("CREATE TRIBE OWNER", createdContact);
    contactIds.push(createdContact.id)
  }
  const date = new Date()
  date.setMilliseconds(0)

  const chatStatus = is_private
    ? constants.chat_statuses.pending
    : constants.chat_statuses.approved
  const chatParams: Partial<Chat> = {
    uuid: uuid,
    contactIds: JSON.stringify(contactIds),
    photoUrl: img || '',
    createdAt: date,
    updatedAt: date,
    name: name,
    type: constants.chat_types.tribe,
    host: host || tribes.getHost(),
    groupKey: group_key,
    ownerPubkey: owner_pubkey,
    private: is_private || false,
    status: chatStatus,
    priceToJoin: amount || 0,
    tenant,
  }
  if (my_alias) chatParams.myAlias = my_alias
  if (my_photo_url) chatParams.myPhotoUrl = my_photo_url

  const typeToSend = is_private
    ? constants.message_types.member_request
    : constants.message_types.group_join
  const contactIdsToSend: string = is_private
    ? JSON.stringify([theTribeOwner.id]) // ONLY SEND TO TRIBE OWNER IF ITS A REQUEST
    : JSON.stringify(contactIds)
  // console.log("=> joinTribe: typeToSend", typeToSend);
  // console.log("=> joinTribe: contactIdsToSend", contactIdsToSend);
  // set my alias to be the custom one
  const theOwner = owner
  if (my_alias) theOwner.alias = my_alias
  network.sendMessage({
    // send my data to tribe owner
    chat: {
      ...chatParams,
      contactIds: contactIdsToSend,
      members: {
        [owner.publicKey]: {
          key: owner.contactKey,
          alias: my_alias || owner.alias || '',
        },
      },
    },
    amount: amount || 0,
    sender: theOwner,
    message: {},
    type: typeToSend,
    failure: function (e) {
      failure(res, e)
    },
    success: async function () {
      // console.log("=> joinTribe: CREATE CHAT RECORD NOW");
      const chat: Chat = (await models.Chat.create(chatParams)) as Chat
      models.ChatMember.create({
        contactId: theTribeOwner.id,
        chatId: chat.id,
        role: constants.chat_roles.owner,
        lastActive: date,
        status: constants.chat_statuses.approved,
        tenant,
      })
      // console.log("=> joinTribe: CREATED CHAT", chat.dataValues);
      tribes.addExtraHost(theOwner.publicKey, host, network.receiveMqttMessage)
      success(res, jsonUtils.chatToJson(chat))
    },
  })
}

/**
 * @function createChannel
 * @param {Req} req
 * @param {res} res
 *
 * @returns {Promise<void>}
 */
export async function createChannel(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const owner = req.owner
  //const tenant: number = req.owner.id

  const { tribe_uuid, name, host } = req.body
  const channel = await tribes.createChannel({
    tribe_uuid,
    name,
    host,
    owner_pubkey: owner.publicKey,
  })
  success(res, channel)
}

/**
 * @function deleteChannel
 * @param {Req} req - The request object containing information about the request made to the server.
 * @param {res} res - The response object used to send a response back to the client.
 *
 * @returns {Promise<void>} - A promise that resolves when the channel has been successfully deleted, or rejects with an error if something goes wrong.
 */
export async function deleteChannel(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')

  const owner = req.owner
  const { id, host } = req.body
  const channel = await tribes.deleteChannel({
    id,
    host,
    owner_pubkey: owner.publicKey,
  })
  success(res, channel)
}

/**
 * @function receiveMemberRequest
 * @param {Object} payload - An object containing information about the request to join a tribe.
 *
 * @returns {Promise<void>} - A promise that resolves when the member request has been successfully processed, or rejects with an error if something goes wrong.
 */
export async function receiveMemberRequest(payload) {
  sphinxLogger.info('=> receiveMemberRequest', logging.Network)
  const {
    owner,
    chat,
    sender_pub_key,
    sender_alias,
    chat_members,
    chat_type,
    isTribeOwner,
    network_type,
    sender_photo_url,
    sender_route_hint,
  } = await helpers.parseReceiveParams(payload)
  const tenant: number = owner.id

  if (!chat) return sphinxLogger.error('no chat')

  const isTribe = chat_type === constants.chat_types.tribe
  if (!isTribe || !isTribeOwner) return sphinxLogger.error('not a tribe')

  const date = new Date()
  date.setMilliseconds(0)

  let theSender: any = null
  const member = chat_members[sender_pub_key]
  const senderAlias = (member && member.alias) || sender_alias || 'Unknown'

  const sender: Contact = (await models.Contact.findOne({
    where: { publicKey: sender_pub_key, tenant },
  })) as Contact
  if (sender) {
    theSender = sender // might already include??
  } else {
    if (member && member.key) {
      const createdContact: Contact = (await models.Contact.create({
        publicKey: sender_pub_key,
        contactKey: member.key,
        alias: sender_alias || senderAlias,
        status: 1,
        fromGroup: true,
        photoUrl: sender_photo_url,
        tenant,
        routeHint: sender_route_hint || '',
      })) as Contact
      theSender = createdContact
    }
  }
  if (!theSender) return sphinxLogger.error('no sender') // fail (no contact key?)

  sphinxLogger.info([
    'UPSERT',
    {
      contactId: theSender.id,
      chatId: chat.id,
      role: constants.chat_roles.reader,
      status: constants.chat_statuses.pending,
      lastActive: date,
      lastAlias: senderAlias,
    },
  ])
  // maybe check here manually????
  try {
    await models.ChatMember.upsert({
      contactId: theSender.id,
      chatId: chat.id,
      role: constants.chat_roles.reader,
      status: constants.chat_statuses.pending,
      lastActive: date,
      lastAlias: senderAlias,
      tenant,
    })
    // also update the chat
    const theChat: Chat = (await models.Chat.findOne({
      where: { id: chat.id },
    })) as Chat
    if (theChat) {
      await theChat.update({ updatedAt: date })
    }
  } catch (e) {
    //we want to do nothing here
  }

  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.member_request,
    sender: (theSender && theSender.id) || 0,
    messageContent: '',
    remoteMessageContent: '',
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  if (isTribe) {
    msg.senderAlias = senderAlias
    msg.senderPic = sender_photo_url
  }
  const message: Message = (await models.Message.create(msg)) as Message

  const theChat = await addPendingContactIdsToChat(chat, tenant)
  socket.sendJson(
    {
      type: 'member_request',
      response: {
        contact: jsonUtils.contactToJson(theSender || {}),
        chat: jsonUtils.chatToJson(theChat),
        message: jsonUtils.messageToJson(message, theChat),
      },
    },
    tenant
  )
}

/**
 * @function pinToTribe
 * @param {Object} req - An Express request object, containing information about the HTTP request.
 * @param {Object} res - An Express response object, used to send a response to the client.
 *
 * @returns {Promise<void>} - A promise that resolves when the pin has been successfully added to the tribe, or rejects with an error if something goes wrong.
 */
export async function pinToTribe(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { pin } = req.body
  const { id } = req.params
  if (!id) return failure(res, 'group id is required')
  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id, tenant },
  })) as ChatRecord
  if (!chat) {
    return failure(res, 'cant find chat')
  }
  const owner = req.owner
  if (owner.publicKey !== chat.ownerPubkey) {
    return failure(res, 'not your tribe')
  }
  try {
    const td = await tribes.get_tribe_data(chat.uuid)
    const chatData = chat.dataValues || chat
    chatData.pin = pin
    await tribes.edit(mergeTribeAndChatData(chatData, td, owner))
    await models.Chat.update({ pin }, { where: { id, tenant } })
    success(res, { pin })
  } catch (e) {
    return failure(res, 'failed to update pin')
  }
}

/**
 * Edits the specified tribe.
 *
 * @param {Req} req - The request object containing the owner, body, and params. The body should have the following properties: name, price_per_message, price_to_join, escrow_amount, escrow_millis, img, description, tags, unlisted, app_url, feed_url, feed_type, pin, and profile_filters. The params should have the id of the tribe to be edited.
 * @param {Res} res - The response object used to return the edited tribe.
 *
 * @returns {Object} - Returns the edited tribe or an error message if the tribe could not be edited.
 */
export async function editTribe(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const {
    name,
    price_per_message,
    price_to_join,
    escrow_amount,
    escrow_millis,
    img,
    description,
    tags,
    unlisted,
    app_url,
    feed_url,
    feed_type,
    pin,
  } = req.body
  const { id } = req.params

  if (!id) return failure(res, 'group id is required')
  let { profile_filters } = req.body
  if (profile_filters) {
    if (!Array.isArray(profile_filters)) {
      return failure(res, 'invalid profile filters')
    } else {
      profile_filters = profile_filters.join(',')
    }
  }

  const chat: Chat = (await models.Chat.findOne({
    where: { id, tenant },
  })) as Chat
  if (!chat) {
    return failure(res, 'cant find chat')
  }

  const owner = req.owner

  let okToUpdate = true
  if (owner.publicKey === chat.ownerPubkey) {
    try {
      await tribes.edit({
        uuid: chat.uuid,
        name: name,
        host: chat.host,
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        description,
        tags,
        img,
        owner_alias: owner.alias,
        unlisted,
        is_private: req.body.private,
        app_url,
        feed_url,
        feed_type,
        deleted: false,
        owner_route_hint: owner.routeHint || '',
        owner_pubkey: owner.publicKey,
        pin: pin || '',
        profile_filters: profile_filters || '',
      })
    } catch (e) {
      okToUpdate = false
    }
  }

  if (okToUpdate) {
    const obj: { [k: string]: any } = {}
    if (img) obj.photoUrl = img
    if (name) obj.name = name
    if (price_per_message || price_per_message === 0)
      obj.pricePerMessage = price_per_message
    if (price_to_join || price_to_join === 0) obj.priceToJoin = price_to_join
    if (escrow_amount || escrow_amount === 0) obj.escrowAmount = escrow_amount
    if (escrow_millis || escrow_millis === 0) obj.escrowMillis = escrow_millis
    if (unlisted || unlisted === false) obj.unlisted = unlisted
    if (app_url) obj.appUrl = app_url
    if (feed_url) obj.feedUrl = feed_url
    if (feed_type) obj.feedType = feed_type
    if (req.body.private || req.body.private === false)
      obj.private = req.body.private
    obj.profileFilters = profile_filters || ''
    if (Object.keys(obj).length > 0) {
      await chat.update(obj)
    }
    success(res, jsonUtils.chatToJson(chat))
  } else {
    failure(res, 'failed to update tribe')
  }
}

type ChatMemberStatus = 'approved' | 'rejected'

/**
 * Approves or rejects a member's request to join a tribe.
 *
 * @param {Req} req - The incoming request object.
 * @param {object} req.owner - The owner object that contains the user's ID and public key.
 * @param {number} req.owner.id - The user's ID.
 * @param {string} req.owner.publicKey - The user's public key.
 * @param {number} req.params.messageId - The ID of the message that the user sent to join the tribe.
 * @param {number} req.params.contactId - The ID of the user who sent the request to join the tribe.
 * @param {string} req.params.status - The status of the member request. Can be either "approved" or "rejected".
 * @param {Res} res - The response object.
 *
 * @returns {object} - Returns an object that contains the updated chat and message.
 * @throws {string} - Returns a string if there is an error.
 */
export async function approveOrRejectMember(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  sphinxLogger.info('=> approve or reject tribe member')
  const msgId = parseInt(req.params['messageId'])
  const contactId = parseInt(req.params['contactId'])
  const status: ChatMemberStatus = req.params['status'] as ChatMemberStatus

  const msg: Message = (await models.Message.findOne({
    where: { id: msgId, tenant },
  })) as Message
  if (!msg) return failure(res, 'no message')
  const chatId = msg.chatId

  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id: chatId, tenant },
  })) as ChatRecord
  if (!chat) return failure(res, 'no chat')

  if (
    !msgId ||
    !contactId ||
    !(status === 'approved' || status === 'rejected')
  ) {
    return failure(res, 'incorrect status')
  }

  let memberStatus = constants.chat_statuses.rejected
  let msgType = constants.message_types.member_reject
  if (status === 'approved') {
    memberStatus = constants.chat_statuses.approved
    msgType = constants.message_types.member_approve
    const contactIds = JSON.parse(chat.contactIds || '[]')
    if (!contactIds.includes(contactId)) contactIds.push(contactId)
    await chat.update({ contactIds: JSON.stringify(contactIds) })
  }

  await msg.update({ type: msgType })

  const member: ChatMember = (await models.ChatMember.findOne({
    where: { contactId, chatId },
  })) as ChatMember
  if (!member) {
    return failure(res, 'cant find chat member')
  }
  if (status === 'approved') {
    // update ChatMember status
    await member.update({ status: memberStatus })
  } else if (status === 'rejected') {
    // destroy the row
    await member.destroy()
  }

  const owner = req.owner
  const chatToSend = chat.dataValues || chat

  network.sendMessage({
    // send to the requester
    chat: { ...chatToSend, contactIds: JSON.stringify([member.contactId]) },
    amount: 0,
    sender: owner,
    message: {},
    type: msgType,
  })

  const theChat = await addPendingContactIdsToChat(chat, tenant)
  success(res, {
    chat: jsonUtils.chatToJson(theChat),
    message: jsonUtils.messageToJson(msg, theChat),
  })
}

/**
 * Receive a message that a member has been approved to join a tribe.
 *
 * @param {Object} payload - The message payload from the server.
 * @param {Object} payload.owner - The owner object for the current user.
 * @param {Object} payload.chat - The chat object for the tribe.
 * @param {Object} payload.sender - The sender object for the user who approved the member.
 * @param {number} payload.network_type - The network type (testnet or mainnet).
 */
export async function receiveMemberApprove(payload) {
  sphinxLogger.info('-> receiveMemberApprove', logging.Network)
  const { owner, chat, sender, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  await chat.update({ status: constants.chat_statuses.approved })

  const tenant: number = owner.id

  const date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.member_approve,
    sender: (sender && sender.id) || 0,
    messageContent: '',
    remoteMessageContent: '',
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  const message: Message = (await models.Message.create(msg)) as Message
  socket.sendJson(
    {
      type: 'member_approve',
      response: {
        message: jsonUtils.messageToJson(message, chat),
        chat: jsonUtils.chatToJson(chat),
      },
    },
    tenant
  )

  const amount = chat.priceToJoin || 0
  const theChat = chat.dataValues || chat
  const theOwner = owner
  const theAlias = chat.myAlias || owner.alias
  if (theAlias) theOwner.alias = theAlias
  // send JOIN and my info to all
  network.sendMessage({
    chat: {
      ...theChat,
      members: {
        [owner.publicKey]: {
          key: owner.contactKey,
          alias: theAlias || '',
        },
      },
    },
    amount,
    sender: theOwner,
    message: {},
    type: constants.message_types.group_join,
  })

  // sendNotification(chat, chat_name, "group", theOwner);
}

/**
 * Processes a tribe member rejection notification.
 *
 * @param {Object} payload - The notification payload containing details of the rejection.
 * @param {Object} payload.owner - The owner of the tribe who rejected the member.
 * @param {Object} payload.chat - The tribe the rejected member belongs to.
 * @param {Object} payload.sender - The user who sent the member rejection notification.
 * @param {string} payload.chat_name - The name of the tribe.
 * @param {string} payload.network_type - The type of network the notification was sent from.
 *
 * @returns {Promise<void>}
 */
export async function receiveMemberReject(payload) {
  sphinxLogger.info('-> receiveMemberReject', logging.Network)
  const { owner, chat, sender, chat_name, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  await chat.update({ status: constants.chat_statuses.rejected })

  const tenant: number = owner.id

  const date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.member_reject,
    sender: (sender && sender.id) || 0,
    messageContent: '',
    remoteMessageContent: '',
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  const message: Message = (await models.Message.create(msg)) as Message
  socket.sendJson(
    {
      type: 'member_reject',
      response: {
        message: jsonUtils.messageToJson(message, chat),
        chat: jsonUtils.chatToJson(chat),
      },
    },
    tenant
  )

  sendNotification(chat, chat_name, 'reject', owner)
}

/**
 * Receives a tribe delete request and updates the chat and sends a notification.
 *
 * @param {Object} payload - The payload containing the request information.
 * @param {Object} payload.owner - The owner of the chat.
 * @param {Object} payload.chat - The chat that was deleted.
 * @param {Object} payload.sender - The sender of the request.
 * @param {string} payload.network_type - The network type.
 *
 * @returns {undefined} - Returns nothing.
 */
export async function receiveTribeDelete(payload) {
  sphinxLogger.info('-> receiveTribeDelete', logging.Network)
  const { owner, chat, sender, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  const tenant: number = owner.id
  // await chat.update({status: constants.chat_statuses.rejected})
  // update on tribes server too
  const date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.tribe_delete,
    sender: (sender && sender.id) || 0,
    messageContent: '',
    remoteMessageContent: '',
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  const message: Message = (await models.Message.create(msg)) as Message
  socket.sendJson(
    {
      type: 'tribe_delete',
      response: {
        message: jsonUtils.messageToJson(message, chat),
        chat: jsonUtils.chatToJson(chat),
      },
    },
    tenant
  )
}

/**
 * Replays the chat history for a given contact in the given chat.
 * @param {Object} chat - The chat object.
 * @param {Object} contact - The contact object.
 * @param {Object} ownerRecord - The owner record object.
 */
export async function replayChatHistory(chat, contact, ownerRecord) {
  const owner = ownerRecord.dataValues || ownerRecord
  const tenant: number = owner.id
  sphinxLogger.info('-> replayHistory', logging.Tribes)
  if (!(chat && chat.id && contact && contact.id)) {
    return sphinxLogger.info('cant replay history', logging.Tribes)
  }

  try {
    const msgs: Message[] = (await models.Message.findAll({
      where: {
        tenant,
        chatId: chat.id,
        type: { [Op.in]: network.typesToReplay },
      },
      order: [['id', 'desc']],
      limit: 40,
    })) as Message[]
    msgs.reverse()

    // if theres a pinned msg in this chat
    if (chat.pin) {
      const pinned = msgs.find((m) => m.uuid === chat.pin)
      // if the pinned msg is not already included
      if (!pinned) {
        const pinnedMsg: Message = (await models.Message.findOne({
          where: {
            tenant,
            chatId: chat.id,
            type: { [Op.in]: network.typesToReplay },
            uuid: chat.pin,
          },
        })) as Message
        // add it
        if (pinnedMsg) {
          msgs.push(pinnedMsg)
        }
      }
    }

    asyncForEach(msgs, async (m) => {
      if (!network.typesToReplay.includes(m.type)) return // only for message for now
      if (chat.skipBroadcastJoins) {
        if (network.typesToSkipIfSkipBroadcastJoins.includes(m.type)) {
          return // no join or leave announcements if set this way
        }
      }
      const sender = {
        ...owner,
        ...(m.senderAlias && { alias: m.senderAlias }),
        role: constants.chat_roles.reader,
        ...(m.senderPic && { photoUrl: m.senderPic }),
      }
      let content = ''
      try {
        content = JSON.parse(m.remoteMessageContent)
      } catch (e) {
        //We want to do nothing here
      }

      let mdate = m.date
      if (!mdate) mdate = new Date()
      const dateString = mdate.toISOString()

      let mediaKeyMap
      let newMediaTerms
      if (m.type === constants.message_types.attachment) {
        if (m.mediaKey && m.mediaToken) {
          const muid =
            m.mediaToken.split('.').length && m.mediaToken.split('.')[1]
          if (muid) {
            const mediaKey: MediaKey = (await models.MediaKey.findOne({
              where: {
                muid,
                chatId: chat.id,
                tenant,
              },
            })) as MediaKey
            // console.log("FOUND MEDIA KEY!!",mediaKey.dataValues)
            mediaKeyMap = { chat: mediaKey.key }
            newMediaTerms = { muid: mediaKey.muid }
          }
        }
      }
      const isForwarded = m.sender !== tenant
      const includeStatus = true
      let msg = network.newmsg(
        m.type,
        chat,
        sender,
        {
          content, // replaced with the remoteMessageContent (u are owner) {}
          uuid: m.uuid,
          replyUuid: m.replyUuid,
          parentId: m.parentId || 0,
          status: m.status,
          amount: m.amount,
          ...(mediaKeyMap && { mediaKey: mediaKeyMap }),
          ...(newMediaTerms && { mediaToken: newMediaTerms }),
          ...(m.mediaType && { mediaType: m.mediaType }),
          ...(dateString && { date: dateString }),
          ...(m.recipientAlias && { recipientAlias: m.recipientAlias }),
          ...(m.recipientPic && { recipientPic: m.recipientPic }),
        },
        isForwarded,
        includeStatus
      )

      msg = await decryptMessage(msg, chat)
      const data = await personalizeMessage(msg, contact, true)
      const mqttTopic = `${contact.publicKey}/${chat.uuid}`
      const replayingHistory = true
      // console.log("-> HISTORY DATA:",data)
      await network.signAndSend(
        {
          data,
          dest: contact.publicKey,
          route_hint: contact.routeHint,
        },
        owner,
        mqttTopic,
        replayingHistory
      )
    }) // end forEach
  } catch (e) {
    sphinxLogger.error(['replayChatHistory ERROR', e])
  }
}

/**
 * Create tribe chat parameters for a new chat.
 * @param {Object} owner - The owner of the chat.
 * @param {number[]} contactIds - An array of contact IDs for the members of the chat.
 * @param {string} name - The name of the chat.
 * @param {string} [img] - The image URL for the chat.
 * @param {number} [price_per_message] - The price per message for the chat.
 * @param {number} [price_to_join] - The price to join the chat.
 * @param {number} [escrow_amount] - The escrow amount for the chat.
 * @param {number} [escrow_millis] - The escrow time in milliseconds for the chat.
 * @param {boolean} [unlisted] - Whether the chat is unlisted.
 * @param {boolean} [is_private] - Whether the chat is private.
 * @param {string} [app_url] - The URL for the chat's app.
 * @param {string} [feed_url] - The URL for the chat's feed.
 * @param {number} [feed_type] - The type of feed for the chat.
 * @param {number} tenant - The tenant ID for the chat.
 * @param {string} [pin] - The UUID of the pinned message for the chat.
 * @param {Object} [profile_filters] - The profile filters for the chat.
 * @returns {Promise<Object>} - An object containing the tribe chat parameters.
 */
export async function createTribeChatParams(
  owner,
  contactIds,
  name,
  img,
  price_per_message,
  price_to_join,
  escrow_amount,
  escrow_millis,
  unlisted,
  is_private,
  app_url,
  feed_url,
  feed_type,
  tenant,
  pin,
  profile_filters
): Promise<{ [k: string]: any }> {
  const date = new Date()
  date.setMilliseconds(0)
  if (!(owner && contactIds && Array.isArray(contactIds))) {
    return {}
  }

  // make ts sig here w LNd pubkey - that is UUID
  const keys = await rsa.genKeys()
  const groupUUID = await tribes.genSignedTimestamp(owner.publicKey)
  const theContactIds = contactIds.includes(owner.id)
    ? contactIds
    : [owner.id].concat(contactIds)
  return {
    uuid: groupUUID,
    ownerPubkey: owner.publicKey,
    contactIds: JSON.stringify(theContactIds),
    createdAt: date,
    updatedAt: date,
    photoUrl: img || '',
    name: name,
    type: constants.chat_types.tribe,
    groupKey: keys.public,
    groupPrivateKey: keys.private,
    host: tribes.getHost(),
    pricePerMessage: price_per_message || 0,
    priceToJoin: price_to_join || 0,
    escrowMillis: escrow_millis || 0,
    escrowAmount: escrow_amount || 0,
    unlisted: unlisted || false,
    private: is_private || false,
    appUrl: app_url || '',
    feedUrl: feed_url || '',
    feedType: feed_type || 0,
    tenant,
    pin: pin || '',
    profileFilters: profile_filters,
  }
}

/**
 * @async
 * @function addPendingContactIdsToChat
 * @description Adds the pending contact IDs of a chat to the chat object
 * @param {Object} achat - The chat object
 * @param {number} tenant - The tenant ID
 * @returns {Object} The updated chat object
 *
 * @throws {Error} If the chat object is not valid
 */
export async function addPendingContactIdsToChat(achat, tenant) {
  const members: ChatMember[] = (await models.ChatMember.findAll({
    where: {
      chatId: achat.id,
      status: constants.chat_statuses.pending, // only pending
      tenant,
    },
  })) as ChatMember[]
  if (!members) return achat
  const pendingContactIds: number[] = members.map((m) => m.contactId)
  const chat = achat.dataValues || achat
  return {
    ...chat,
    pendingContactIds,
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function mergeTribeAndChatData(chat, td: Tribe, owner) {
  return {
    uuid: chat.uuid,
    name: chat.name,
    host: chat.host,
    price_per_message: chat.pricePerMessage,
    price_to_join: chat.priceToJoin,
    escrow_amount: chat.escrowAmount,
    escrow_millis: chat.escrowMillis,
    app_url: chat.appUrl,
    feed_url: chat.feedUrl,
    feed_type: chat.feedType,
    pin: chat.pin || '',
    deleted: false,
    owner_alias: owner.alias,
    owner_route_hint: owner.routeHint || '',
    owner_pubkey: owner.publicKey,
    description: td.description,
    tags: td.tags,
    img: td.img,
    unlisted: td.unlisted,
    is_private: td.private,
  }
}
