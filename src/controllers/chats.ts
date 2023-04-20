import {
  Chat,
  ChatRecord,
  Contact,
  ContactRecord,
  ChatMember,
  Message,
  models,
} from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as helpers from '../helpers'
import * as network from '../network'
import { Payload, ChatMember as ChatMemberNetwork } from '../network'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import * as md5 from 'md5'
import * as tribes from '../utils/tribes'
import * as timers from '../utils/timers'
import {
  replayChatHistory,
  createTribeChatParams,
  addPendingContactIdsToChat,
} from './chatTribes'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import { Req, Res } from '../types'
import { asyncForEach } from '../helpers'
import { loadConfig } from '../utils/config'
import { errMsgString } from '../utils/errMsgString'

const config = loadConfig()

/**
 * Updates a chat.
 *
 * @param {Req} req - The request object containing the owner, id, and body of the chat to update.
 * @param {Response} res - The response object used to send the updated chat.
 * @returns {Promise<void>}
 */
export async function updateChat(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  sphinxLogger.info(`=> updateChat`)
  const id = parseInt(req.params.id)
  if (!id) {
    return failure(res, 'missing id')
  }
  const chat: Chat = (await models.Chat.findOne({
    where: { id, tenant },
  })) as Chat
  if (!chat) {
    return failure(res, 'chat not found')
  }
  const { name, photo_url, meta, my_alias, my_photo_url } = req.body

  //const obj: { [k: string]: any } = {}
  const obj: {
    name?: string
    photoUrl?: string
    meta?: string
    myAlias?: string
    myPhotoUrl?: string
  } = {}
  if (name) obj.name = name
  if (photo_url) obj.photoUrl = photo_url
  if (meta && typeof meta === 'string') obj.meta = meta
  if (my_alias) obj.myAlias = my_alias
  if (my_photo_url || my_photo_url === '') obj.myPhotoUrl = my_photo_url

  if (Object.keys(obj).length > 0) {
    await chat.update(obj)
  }
  success(res, jsonUtils.chatToJson(chat))
}

/**
 * Kicks a member from a chat.
 *
 * @param {Req} req - The request object containing the owner, chat_id, and contact_id of the chat and contact to kick.
 * @param {Response} res - The response object used to send the updated chat.
 * @returns {Promise<void>}
 */
export async function kickChatMember(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const chatId = parseInt(req.params['chat_id'])
  const contactId = parseInt(req.params['contact_id'])
  if (!chatId || !contactId) {
    return failure(res, 'missing param')
  }
  // remove chat.contactIds
  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id: chatId, tenant },
  })) as ChatRecord
  const contactIds = JSON.parse(chat.contactIds || '[]')
  const newContactIds = contactIds.filter((cid) => cid !== contactId)
  await chat.update({ contactIds: JSON.stringify(newContactIds) })
  // remove from ChatMembers
  await models.ChatMember.destroy({
    where: {
      chatId,
      contactId,
      tenant,
    },
  })

  const owner = req.owner as Contact
  network.sendMessage({
    chat: {
      ...chat.dataValues,
      contactIds: JSON.stringify([contactId]), // send only to the guy u kicked
    },
    sender: owner,
    message: {} as Message,
    type: constants.message_types.group_kick,
  })

  // delete all timers for this member
  timers.removeTimersByContactIdChatId(contactId, chatId, tenant)

  success(res, jsonUtils.chatToJson(chat))
}

/**
 * Receives a group kick message and processes it.
 *
 * @param {Payload} payload - The payload containing the chat, owner, sender, date_string, and network_type of the group kick message.
 * @returns {Promise<void>}
 */
export async function receiveGroupKick(payload: Payload): Promise<void> {
  sphinxLogger.info(`=> receiveGroupKick`, logging.Network)
  const { owner, chat, sender, date_string, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!chat) return
  const tenant: number = owner.id

  // const owner = await models.Contact.findOne({where:{isOwner:true}})
  // await chat.update({
  // 	deleted: true,
  // 	uuid:'',
  // 	groupKey:'',
  // 	host:'',
  // 	photoUrl:'',
  // 	contactIds:'[]',
  // 	name:''
  // })
  // await models.Message.destroy({ where: { chatId: chat.id } })

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)
  const msg: Partial<Message> = {
    chatId: chat.id,
    type: constants.message_types.group_kick,
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
      type: 'group_kick',
      response: {
        contact: jsonUtils.contactToJson(sender),
        chat: jsonUtils.chatToJson(chat),
        message: jsonUtils.messageToJson(message),
      },
    },
    tenant
  )
}

/**
 * Gets a list of chats.
 *
 * @param {Req} req - The request object containing the owner.
 * @param {Response} res - The response object used to send the list of chats.
 * @returns {Promise<void>}
 */
export async function getChats(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const chats: Chat[] = (await models.Chat.findAll({
    where: { deleted: false, tenant },
    raw: true,
  })) as Chat[]
  const c = chats.map((chat) => jsonUtils.chatToJson(chat))
  success(res, c)
}

/**
 * Sets the notification level for a chat.
 *
 * @param {Req} req - The request object containing the owner, chat_id, and level of the chat to update.
 * @param {Response} res - The response object used to send the updated chat.
 * @returns {Promise<void>}
 */
export async function setNotifyLevel(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const chatId = req.params['chat_id']
  const levelString = req.params['level']
  const level = parseInt(levelString)
  if (!chatId) {
    return failure(res, 'setNotifyLevel no chatId')
  }
  if (!Object.values(constants.notify_levels).includes(level)) {
    return failure(res, 'invalid notify level')
  }
  const chat = await models.Chat.findOne({ where: { id: chatId, tenant } })
  if (!chat) {
    return failure(res, 'chat not found')
  }
  const isMuted: boolean = level === constants.notify_levels.mute
  await chat.update({ notify: level, isMuted })

  success(res, jsonUtils.chatToJson(chat))
}

/**
 * Mutes or unmutes a chat.
 *
 * @param {Req} req - The request object containing the owner, chat_id, and mute_unmute of the chat to mute or unmute.
 * @param {Response} res - The response object used to send the updated chat.
 * @returns {Promise<void>}
 */
export async function mute(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const chatId = req.params['chat_id']
  const mute = req.params['mute_unmute']

  if (!['mute', 'unmute'].includes(mute)) {
    return failure(res, 'invalid option for mute')
  }

  const chat: Chat = (await models.Chat.findOne({
    where: { id: chatId, tenant },
  })) as Chat

  if (!chat) {
    return failure(res, 'chat not found')
  }

  const isMuted = mute == 'mute'
  await chat.update({
    isMuted,
    notify: isMuted
      ? constants.notify_levels.mute
      : constants.notify_levels.all,
  })

  success(res, jsonUtils.chatToJson(chat))
}

// just add self here if tribes
// or can u add contacts as members?
export async function createGroupChat(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const {
    name,
    is_tribe,
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
    call_recording,
    meme_server_location,
    jitsi_server,
    stakwork_api_key,
    stakwork_webhook,
  } = req.body

  let { profile_filters } = req.body
  if (profile_filters) {
    if (!Array.isArray(profile_filters)) {
      return failure(res, 'invalid profile filters')
    } else {
      profile_filters = profile_filters.join(',')
    }
  }

  if (call_recording) {
    if (typeof call_recording !== 'number') {
      return failure(res, 'invalid call recording value')
    } else {
      if (call_recording !== 0 && call_recording !== 1) {
        return failure(res, 'invalid call recording value')
      }
    }
  }

  const contact_ids: number[] = req.body.contact_ids || []

  const members: { [k: string]: ChatMemberNetwork } = {} //{pubkey:{key,alias}, ...}
  const owner = req.owner

  members[owner.publicKey] = {
    key: owner.contactKey,
    alias: owner.alias,
  }
  await asyncForEach(contact_ids, async (cid) => {
    const contact: Contact = (await models.Contact.findOne({
      where: { id: cid, tenant },
    })) as Contact
    members[contact.publicKey] = {
      key: contact.contactKey,
      alias: contact.alias || '',
    }
  })

  let chatParams: Chat
  let okToCreate = true
  if (is_tribe) {
    chatParams = (await createTribeChatParams(
      owner,
      contact_ids,
      name,
      img,
      price_per_message,
      price_to_join,
      escrow_amount,
      escrow_millis,
      unlisted,
      req.body.private,
      app_url,
      feed_url,
      feed_type,
      tenant,
      pin,
      profile_filters || '',
      call_recording,
      meme_server_location,
      jitsi_server,
      stakwork_api_key,
      stakwork_webhook
    )) as Chat
    if (chatParams.uuid) {
      // publish to tribe server
      try {
        await tribes.declare({
          uuid: chatParams.uuid,
          name: chatParams.name,
          host: chatParams.host,
          group_key: chatParams.groupKey,
          price_per_message: price_per_message || 0,
          price_to_join: price_to_join || 0,
          escrow_amount: escrow_amount || 0,
          escrow_millis: escrow_millis || 0,
          description,
          tags,
          img,
          owner_pubkey: owner.publicKey,
          owner_alias: owner.alias,
          unlisted: unlisted || false,
          is_private: req.body.private || false,
          app_url,
          feed_url,
          feed_type,
          owner_route_hint: owner.routeHint || '',
          pin: pin || '',
          profile_filters: profile_filters || '',
        })
      } catch (e) {
        sphinxLogger.error(`=> couldnt create tribe ${e}`)
        okToCreate = false
      }
    }
    // make me owner when i create
    members[owner.publicKey].role = constants.chat_roles.owner
  } else {
    chatParams = createGroupChatParams(
      owner,
      contact_ids,
      members,
      name
    ) as Chat
  }

  if (!okToCreate) {
    return failure(res, 'could not create tribe')
  }

  network.sendMessage({
    chat: { ...chatParams, members },
    sender: owner,
    type: constants.message_types.group_create,
    message: {} as Message,
    failure: function (e) {
      let errMsg = errMsgString(e)
      failure(res, errMsg || e)
    },
    success: async function () {
      const chat: Chat = (await models.Chat.create(chatParams)) as Chat
      if (chat.type === constants.chat_types.tribe) {
        // save me as owner when i create
        try {
          await models.ChatMember.create({
            contactId: owner.id,
            chatId: chat.id,
            role: constants.chat_roles.owner,
            status: constants.chat_statuses.approved,
            tenant,
          })
        } catch (e) {
          sphinxLogger.error(`=> createGroupChat failed to UPSERT ${e}`)
        }
      }
      success(res, jsonUtils.chatToJson(chat))
    },
  })
}

// only owner can do for tribe?
export async function addGroupMembers(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const { contact_ids } = req.body
  const { id } = req.params

  const members: { [k: string]: ChatMemberNetwork } = {} //{pubkey:{key,alias}, ...}
  const owner = req.owner
  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id, tenant },
  })) as ChatRecord

  const contactIds: number[] = JSON.parse(chat.contactIds || '[]')
  // for all members (existing and new)
  members[owner.publicKey] = { key: owner.contactKey, alias: owner.alias }
  if (chat.type === constants.chat_types.tribe) {
    const me: ChatMember = (await models.ChatMember.findOne({
      where: { contactId: owner.id, chatId: chat.id, tenant },
    })) as ChatMember
    if (me) members[owner.publicKey].role = me.role
  }
  const allContactIds = contactIds.concat(contact_ids)
  await asyncForEach(allContactIds, async (cid) => {
    const contact: Contact = (await models.Contact.findOne({
      where: { id: cid, tenant },
    })) as Contact
    if (contact) {
      members[contact.publicKey] = {
        key: contact.contactKey,
        alias: contact.alias,
      }
      const member: ChatMember = (await models.ChatMember.findOne({
        where: { contactId: owner.id, chatId: chat.id, tenant },
      })) as ChatMember
      if (member) members[contact.publicKey].role = member.role
    }
  })

  success(res, jsonUtils.chatToJson(chat))

  network.sendMessage({
    // send ONLY to new members
    chat: { ...(chat.dataValues as Chat), contactIds: contact_ids, members },
    sender: owner,
    type: constants.message_types.group_invite,
    message: {} as Message,
  })
}

export const deleteChat = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const { id } = req.params

  const owner = req.owner
  const chat: Chat = (await models.Chat.findOne({
    where: { id, tenant },
  })) as Chat
  if (!chat) {
    return failure(res, 'you are not in this group')
  }

  const tribeOwnerPubKey = chat.ownerPubkey
  if (owner.publicKey === tribeOwnerPubKey) {
    // delete a group or tribe
    let notOK = false
    await network.sendMessage({
      chat,
      sender: owner,
      message: {} as Message,
      type: constants.message_types.tribe_delete,
      success: function () {
        tribes.delete_tribe(chat.uuid, owner.publicKey)
      },
      failure: function () {
        failure(res, 'failed to send tribe_delete message')
        notOK = true
      },
    })
    if (notOK) return sphinxLogger.error(`failed to send tribe_delete message`)
  } else {
    // leave a group or tribe
    const isPending = chat.status === constants.chat_statuses.pending
    const isRejected = chat.status === constants.chat_statuses.rejected
    if (!isPending && !isRejected) {
      // dont send if pending
      network.sendMessage({
        chat,
        sender: owner,
        message: {} as Message,
        type: constants.message_types.group_leave,
      })
    }
  }

  await chat.update({
    deleted: true,
    uuid: '',
    groupKey: '',
    host: '',
    photoUrl: '',
    contactIds: '[]',
    name: '',
  })
  await models.Message.destroy({ where: { chatId: id, tenant } })
  await models.ChatMember.destroy({ where: { chatId: id, tenant } })

  success(res, { chat_id: id })
}

export const addTribeMember = async (
  req: Req,
  res: Response
): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { chat_id, pub_key, photo_url, route_hint, alias, contact_key } =
    req.body
  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id: chat_id, tenant },
  })) as ChatRecord
  if (!chat) {
    return failure(res, 'chat not found')
  }
  const member = { key: contact_key, alias }
  const date = new Date()
  const added = await addMemberToTribe({
    sender_pub_key: pub_key,
    tenant,
    chat,
    date,
    senderAlias: alias,
    member,
    sender_photo_url: photo_url,
    sender_route_hint: route_hint,
    isTribeOwner: true,
  })
  success(res, { id: added.theSender.id })
}

interface AddMemberToTribeRet {
  theSender: Contact
  member_count: number
}
async function addMemberToTribe({
  sender_pub_key,
  tenant,
  chat,
  date,
  senderAlias,
  member,
  sender_photo_url,
  sender_route_hint,
  isTribeOwner,
}: {
  sender_pub_key: string
  tenant: number
  chat: ChatRecord
  date: Date
  senderAlias: string
  member: network.ChatMember
  sender_photo_url: string
  sender_route_hint: string
  isTribeOwner: boolean
}): Promise<AddMemberToTribeRet> {
  let theSender: Contact | null = null
  const sender: Contact = (await models.Contact.findOne({
    where: { publicKey: sender_pub_key, tenant },
  })) as Contact
  const contactIds = JSON.parse(chat.contactIds || '[]')
  if (sender) {
    theSender = sender // might already include??
    if (!contactIds.includes(sender.id)) contactIds.push(sender.id)
    // update sender contacT_key in case they reset?
    if (member && member.key) {
      if (sender.contactKey !== member.key) {
        await sender.update({ contactKey: member.key })
      }
    }
  } else {
    if (member && member.key) {
      const createdContact: Contact = (await models.Contact.create({
        publicKey: sender_pub_key,
        contactKey: member.key,
        alias: senderAlias,
        status: 1,
        fromGroup: true,
        photoUrl: sender_photo_url,
        tenant,
        routeHint: sender_route_hint || '',
      })) as Contact
      theSender = createdContact
      contactIds.push(createdContact.id)
    } else {
      console.log('=> error in addMemberToTribe: no contact_key')
    }
  }
  if (!theSender) throw new Error(`no sender`) // fail (no contact key?)

  await chat.update({ contactIds: JSON.stringify(contactIds) })

  if (isTribeOwner) {
    // IF TRIBE, ADD new member TO XREF
    sphinxLogger.info(
      `UPSERT CHAT MEMBER ${{
        contactId: theSender.id,
        chatId: chat.id,
        role: constants.chat_roles.reader,
        status: constants.chat_statuses.pending,
        lastActive: date,
        lastAlias: senderAlias,
        tenant,
      }}`
    )
    try {
      await models.ChatMember.upsert({
        contactId: theSender.id,
        chatId: chat.id,
        role: constants.chat_roles.reader,
        lastActive: date,
        status: constants.chat_statuses.approved,
        lastAlias: senderAlias,
        tenant,
      })
    } catch (e) {
      sphinxLogger.error(`=> groupJoin could not upsert ChatMember`)
    }
  }
  return { theSender, member_count: contactIds.length }
}

export async function receiveGroupJoin(payload: Payload): Promise<void> {
  sphinxLogger.info(`=> receiveGroupJoin`, logging.Network)
  const {
    owner,
    chat,
    sender_pub_key,
    sender_alias,
    chat_members,
    chat_type,
    isTribeOwner,
    date_string,
    network_type,
    sender_photo_url,
    sender_route_hint,
    chat_name,
  } = await helpers.parseReceiveParams(payload)

  if (!chat) return

  sphinxLogger.info(
    `=> receiveGroupJoin from ${sender_pub_key} in ${chat.id}. tenant ${owner.id}`,
    logging.Network
  )

  const tenant: number = owner.id

  const isTribe = chat_type === constants.chat_types.tribe

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)

  // let theSender: Contact | null = null
  const member = chat_members[sender_pub_key]
  const senderAlias = (member && member.alias) || sender_alias || 'Unknown'

  try {
    const { theSender, member_count } = await addMemberToTribe({
      sender_pub_key,
      tenant,
      chat,
      senderAlias,
      member,
      date,
      sender_photo_url,
      sender_route_hint,
      isTribeOwner,
    })

    if (isTribeOwner) {
      setTimeout(() => {
        replayChatHistory(chat, theSender, owner)
      }, 2000)
      tribes.putstats({
        chatId: chat.id,
        uuid: chat.uuid,
        host: chat.host,
        member_count,
        owner_pubkey: owner.publicKey,
      })
    }

    const msg: Partial<Message> = {
      chatId: chat.id,
      type: constants.message_types.group_join,
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
      msg.senderAlias = sender_alias
      msg.senderPic = sender_photo_url
    }
    const message: Message = (await models.Message.create(msg)) as Message

    const theChat = await addPendingContactIdsToChat(chat, tenant)
    socket.sendJson(
      {
        type: 'group_join',
        response: {
          contact: jsonUtils.contactToJson(theSender || {}),
          chat: jsonUtils.chatToJson(theChat),
          message: jsonUtils.messageToJson(message),
        },
      },
      tenant
    )

    if (isTribeOwner) {
      sendNotification(chat, chat_name, 'group_join', owner)
    }
  } catch (e) {
    console.log('failed to add member to tribe', e)
    return sphinxLogger.error(`failed to add member to tribe ${chat.id}`)
  }
}

export async function receiveGroupLeave(payload: Payload): Promise<void> {
  sphinxLogger.info(`=> receiveGroupLeave`, logging.Network)
  const {
    chat,
    owner,
    sender_pub_key,
    chat_type,
    sender_alias,
    isTribeOwner,
    date_string,
    network_type,
    sender_photo_url,
    chat_name,
  } = await helpers.parseReceiveParams(payload)
  const tenant: number = owner.id
  if (!chat) return

  const isTribe = chat_type === constants.chat_types.tribe

  let sender: Contact | undefined
  // EITHER private chat OR tribeOwner
  if (!isTribe || isTribeOwner) {
    const sender: Contact = (await models.Contact.findOne({
      where: { publicKey: sender_pub_key, tenant },
    })) as Contact
    if (!sender)
      return sphinxLogger.error(`=> receiveGroupLeave cant find sender`)

    const oldContactIds = JSON.parse(chat.contactIds || '[]')
    const contactIds = oldContactIds.filter((cid) => cid !== sender.id)
    await chat.update({ contactIds: JSON.stringify(contactIds) })

    if (isTribeOwner) {
      if (chat_type === constants.chat_types.tribe) {
        try {
          await models.ChatMember.destroy({
            where: { chatId: chat.id, contactId: sender.id, tenant },
          })
        } catch (e) {
          // dont care about the error
        }
        tribes.putstats({
          chatId: chat.id,
          uuid: chat.uuid,
          host: chat.host,
          member_count: contactIds.length,
          owner_pubkey: owner.publicKey,
        })
      }
    }
  }

  let date = new Date()
  date.setMilliseconds(0)
  if (date_string) date = new Date(date_string)
  const msg: Partial<Message> = {
    chatId: chat.id,
    type: constants.message_types.group_leave,
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
  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
  }
  const message: Message = (await models.Message.create(msg)) as Message

  socket.sendJson(
    {
      type: 'group_leave',
      response: {
        contact: jsonUtils.contactToJson(sender),
        chat: jsonUtils.chatToJson(chat),
        message: jsonUtils.messageToJson(message),
      },
    },
    tenant
  )

  if (isTribeOwner) {
    sendNotification(chat, chat_name, 'group_leave', owner)
  }
}

async function validateTribeOwner(chat_uuid: string, pubkey: string) {
  const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(chat_uuid)
  if (verifiedOwnerPubkey === pubkey) {
    return true
  }
  return false
}
export async function receiveGroupCreateOrInvite(
  payload: Payload
): Promise<void> {
  const {
    owner,
    sender_pub_key,
    chat_members,
    chat_name,
    chat_uuid,
    chat_type,
    chat_host,
    chat_key,
  } = await helpers.parseReceiveParams(payload)
  const tenant: number = owner.id
  // maybe this just needs to move to adding tribe owner ChatMember?
  const isTribe = chat_type === constants.chat_types.tribe
  if (isTribe) {
    // must be sent by tribe owner?????
    const validOwner = await validateTribeOwner(chat_uuid, sender_pub_key)
    if (!validOwner)
      return sphinxLogger.error(`invalid uuid signature!`, logging.Tribes)
  }

  const contacts: ContactRecord[] = []
  const newContacts: Contact[] = []
  for (const [pubkey, member] of Object.entries(chat_members)) {
    const contact: ContactRecord = (await models.Contact.findOne({
      where: { publicKey: pubkey, tenant },
    })) as ContactRecord
    let addContact = false
    if (chat_type === constants.chat_types.group && member && member.key) {
      addContact = true
    } else if (isTribe && member && member.role) {
      if (
        member.role === constants.chat_roles.owner ||
        member.role === constants.chat_roles.admin ||
        member.role === constants.chat_roles.mod
      ) {
        addContact = true
      }
    }
    if (addContact) {
      if (!contact) {
        const createdContact: ContactRecord = (await models.Contact.create({
          publicKey: pubkey,
          contactKey: member.key,
          alias: member.alias || 'Unknown',
          status: 1,
          fromGroup: true,
          tenant,
        })) as ContactRecord
        contacts.push({
          ...createdContact.dataValues,
          role: member.role,
        } as ContactRecord)
        newContacts.push(createdContact.dataValues as Contact)
      } else {
        contacts.push({
          ...contact.dataValues,
          role: member.role,
        } as ContactRecord)
      }
    }
  }

  const contactIds = contacts.map((c) => c.id)
  if (!contactIds.includes(owner.id)) contactIds.push(owner.id)
  // make chat
  const date = new Date()
  date.setMilliseconds(0)
  const chat: ChatRecord = (await models.Chat.create({
    uuid: chat_uuid,
    contactIds: JSON.stringify(contactIds),
    createdAt: date,
    updatedAt: date,
    name: chat_name,
    type: chat_type || constants.chat_types.group,
    ...(chat_host && { host: chat_host }),
    ...(chat_key && { groupKey: chat_key }),
    tenant,
  })) as ChatRecord

  if (isTribe) {
    // IF TRIBE, ADD TO XREF
    contacts.forEach((c) => {
      models.ChatMember.create({
        contactId: c.id,
        chatId: chat.id,
        role: c.role || constants.chat_roles.reader,
        lastActive: date,
        status: constants.chat_statuses.approved,
      })
    })
  }

  socket.sendJson(
    {
      type: 'group_create',
      response: jsonUtils.messageToJson({ newContacts }, chat),
    },
    tenant
  )

  // sendNotification(chat, chat_name, "group", owner);

  if (payload.type === constants.message_types.group_invite) {
    network.sendMessage({
      chat: {
        ...(chat.dataValues as Chat),
        members: {
          [owner.publicKey]: {
            key: owner.contactKey,
            alias: owner.alias || '',
          },
        },
      },
      sender: owner,
      message: {} as Message,
      type: constants.message_types.group_join,
    })
  }
}

function createGroupChatParams(
  owner,
  contactIds,
  members,
  name
): undefined | Partial<Chat> {
  const date = new Date()
  date.setMilliseconds(0)
  if (!(owner && members && contactIds && Array.isArray(contactIds))) {
    return
  }

  const pubkeys: string[] = []
  for (const pubkey of Object.keys(members)) {
    // just the key
    pubkeys.push(String(pubkey))
  }
  if (!(pubkeys && pubkeys.length)) return

  const allkeys = pubkeys.includes(owner.publicKey)
    ? pubkeys
    : [owner.publicKey].concat(pubkeys)
  const hash = md5(allkeys.sort().join('-'))
  const theContactIds = contactIds.includes(owner.id)
    ? contactIds
    : [owner.id].concat(contactIds)
  return {
    uuid: `${new Date().valueOf()}-${hash}`,
    contactIds: JSON.stringify(theContactIds),
    createdAt: date,
    updatedAt: date,
    name: name,
    type: constants.chat_types.group,
  }
}

export async function addTribePreivew(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { chat_id } = req.params
  const { preview } = req.body

  if (!preview && !config.default_cache_host)
    return failure(res, 'provide cache server url')

  const cache_url = preview || config.default_cache_host
  try {
    const tribe = (await models.Chat.findOne({
      where: {
        id: chat_id,
        tenant,
        ownerPubkey: req.owner.publicKey,
        deleted: false,
      },
    })) as ChatRecord
    if (!tribe) {
      return failure(res, 'Tribe does not exist')
    }
    if (tribe.private) {
      return failure(res, 'You cannot add preview to a private tribe')
    }

    if (tribe.preview) return failure(res, 'Preview already set for this tribe')

    //verify preview url
    const cacheServerDetails: { contact_key: string; pubkey: string } =
      await tribes.verifyTribePreviewUrl(cache_url)

    //add cache server to tribe
    const date = new Date()
    const alias = 'cache'
    await addMemberToTribe({
      sender_pub_key: cacheServerDetails.pubkey,
      tenant,
      chat: tribe,
      date,
      senderAlias: alias,
      sender_photo_url: '',
      sender_route_hint: '',
      member: { key: cacheServerDetails.contact_key, alias },
      isTribeOwner: true,
    })

    // Update tribe on tribe server
    await tribes.updateRemoteTribeServer({
      server: tribe.host,
      preview_url: cache_url,
      chat_uuid: tribe.uuid,
      owner_pubkey: tribe.ownerPubkey,
    })

    //update preview
    await tribe.update({ preview: cache_url })
    return success(res, 'preview added successfully to tribe')
  } catch (error) {
    sphinxLogger.error(`=> couldnt add preview to tribe ${error}`)
    return failure(res, error)
  }
}
