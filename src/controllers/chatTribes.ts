import { models, Chat } from '../models'
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
import { Req } from '../types'

export async function joinTribe(req: Req, res) {
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

  const existing = await models.Chat.findOne({ where: { uuid, tenant } })
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

  const tribeOwner = await models.Contact.findOne({
    where: { publicKey: ownerPubKey, tenant },
  })

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
    const createdContact = await models.Contact.create({
      publicKey: ownerPubKey,
      contactKey: '',
      alias: owner_alias || 'Unknown',
      status: 1,
      fromGroup: true,
      tenant,
      routeHint: owner_route_hint || '',
    })
    theTribeOwner = createdContact
    // console.log("CREATE TRIBE OWNER", createdContact);
    contactIds.push(createdContact.id)
  }
  let date = new Date()
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
      const chat = await models.Chat.create(chatParams)
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

  var date = new Date()
  date.setMilliseconds(0)

  let theSender: any = null
  const member = chat_members[sender_pub_key]
  const senderAlias = (member && member.alias) || sender_alias || 'Unknown'

  const sender = await models.Contact.findOne({
    where: { publicKey: sender_pub_key, tenant },
  })
  if (sender) {
    theSender = sender // might already include??
  } else {
    if (member && member.key) {
      const createdContact = await models.Contact.create({
        publicKey: sender_pub_key,
        contactKey: member.key,
        alias: sender_alias || senderAlias,
        status: 1,
        fromGroup: true,
        photoUrl: sender_photo_url,
        tenant,
        routeHint: sender_route_hint || '',
      })
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
    const theChat = await models.Chat.findOne({ where: { id: chat.id } })
    if (theChat) {
      await theChat.update({ updatedAt: date })
    }
  } catch (e) {}

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
  const message = await models.Message.create(msg)

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

export async function pinToTribe(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { pin } = req.body
  const { id } = req.params
  if (!id) return failure(res, 'group id is required')
  const chat = await models.Chat.findOne({ where: { id, tenant } })
  if (!chat) {
    return failure(res, 'cant find chat')
  }
  const owner = req.owner
  if (owner.publicKey !== chat.ownerPubkey) {
    return failure(res, 'not your tribe')
  }
  try {
    let td = await tribes.get_tribe_data(chat.uuid)
    let chatData = chat.dataValues || chat
    chatData.pin = pin
    await tribes.edit(mergeTribeAndChatData(chatData, td, owner))
    await models.Chat.update({ pin }, { where: { id, tenant } })
    success(res, { pin })
  } catch (e) {
    return failure(res, 'failed to update pin')
  }
}

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

  const chat = await models.Chat.findOne({ where: { id, tenant } })
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
    if (Object.keys(obj).length > 0) {
      await chat.update(obj)
    }
    success(res, jsonUtils.chatToJson(chat))
  } else {
    failure(res, 'failed to update tribe')
  }
}

type ChatMemberStatus = 'approved' | 'rejected'
export async function approveOrRejectMember(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  sphinxLogger.info('=> approve or reject tribe member')
  const msgId = parseInt(req.params['messageId'])
  const contactId = parseInt(req.params['contactId'])
  const status: ChatMemberStatus = req.params['status'] as ChatMemberStatus

  const msg = await models.Message.findOne({ where: { id: msgId, tenant } })
  if (!msg) return failure(res, 'no message')
  const chatId = msg.chatId

  const chat = await models.Chat.findOne({ where: { id: chatId, tenant } })
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

  const member = await models.ChatMember.findOne({
    where: { contactId, chatId },
  })
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
    chat: { ...chatToSend, contactIds: [member.contactId] },
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

export async function receiveMemberApprove(payload) {
  sphinxLogger.info('-> receiveMemberApprove', logging.Network)
  const { owner, chat, sender, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  await chat.update({ status: constants.chat_statuses.approved })

  const tenant: number = owner.id

  let date = new Date()
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
  const message = await models.Message.create(msg)
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

export async function receiveMemberReject(payload) {
  sphinxLogger.info('-> receiveMemberReject', logging.Network)
  const { owner, chat, sender, chat_name, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  await chat.update({ status: constants.chat_statuses.rejected })

  const tenant: number = owner.id

  let date = new Date()
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
  const message = await models.Message.create(msg)
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

export async function receiveTribeDelete(payload) {
  sphinxLogger.info('-> receiveTribeDelete', logging.Network)
  const { owner, chat, sender, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return sphinxLogger.error('no chat')
  const tenant: number = owner.id
  // await chat.update({status: constants.chat_statuses.rejected})
  // update on tribes server too
  let date = new Date()
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
  const message = await models.Message.create(msg)
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

export async function replayChatHistory(chat, contact, ownerRecord) {
  const owner = ownerRecord.dataValues || ownerRecord
  const tenant: number = owner.id
  sphinxLogger.info('-> replayHistory', logging.Tribes)
  if (!(chat && chat.id && contact && contact.id)) {
    return sphinxLogger.info('cant replay history', logging.Tribes)
  }

  try {
    const msgs = await models.Message.findAll({
      where: {
        tenant,
        chatId: chat.id,
        type: { [Op.in]: network.typesToReplay },
      },
      order: [['id', 'desc']],
      limit: 40,
    })
    msgs.reverse()

    // if theres a pinned msg in this chat
    if (chat.pin) {
      const pinned = msgs.find((m) => m.uuid === chat.pin)
      // if the pinned msg is not already included
      if (!pinned) {
        const pinnedMsg = await models.Message.findOne({
          where: {
            tenant,
            chatId: chat.id,
            type: { [Op.in]: network.typesToReplay },
            uuid: chat.pin,
          },
        })
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
      } catch (e) {}

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
            const mediaKey = await models.MediaKey.findOne({
              where: {
                muid,
                chatId: chat.id,
                tenant,
              },
            })
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
  pin
): Promise<{ [k: string]: any }> {
  let date = new Date()
  date.setMilliseconds(0)
  if (!(owner && contactIds && Array.isArray(contactIds))) {
    return {}
  }

  // make ts sig here w LNd pubkey - that is UUID
  const keys: { [k: string]: string } = await rsa.genKeys()
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
  }
}

export async function addPendingContactIdsToChat(achat, tenant) {
  const members = await models.ChatMember.findAll({
    where: {
      chatId: achat.id,
      status: constants.chat_statuses.pending, // only pending
      tenant,
    },
  })
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
