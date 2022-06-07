import { models, Chat, Contact, ContactRecord, ChatRecord } from './models'
import * as md5 from 'md5'
import { signAndSend } from './network'
import type { Msg, Payload, ChatMember } from './network/interfaces'
import constants from './constants'
import { logging, sphinxLogger } from './utils/logger'

export const findOrCreateChat = async (params: { chat_id: number, owner_id: number, recipient_id: number }): Promise<Chat | undefined> => {
  const { chat_id, owner_id, recipient_id } = params
  // console.log("chat_id, owner_id, recipient_id", chat_id, owner_id, recipient_id)
  let chat: Chat
  const date = new Date()
  date.setMilliseconds(0)
  // console.log("findOrCreateChat", chat_id, typeof chat_id, owner_id, typeof owner_id)
  if (chat_id) {
    chat = await models.Chat.findOne({
      where: { id: chat_id, tenant: owner_id },
    }) as unknown as Chat
    // console.log('findOrCreateChat: chat_id exists')
  } else {
    if (!owner_id || !recipient_id) return
    sphinxLogger.info(`chat does not exists, create new`)
    const owner: ContactRecord = await models.Contact.findOne({
      where: { id: owner_id },
    })
    const recipient = await models.Contact.findOne({
      where: { id: recipient_id, tenant: owner_id },
    }) as unknown as Contact
    const uuid = md5([owner.publicKey, recipient.publicKey].sort().join('-'))

    // find by uuid
    chat = await models.Chat.findOne({
      where: { uuid, tenant: owner_id, deleted: false },
    }) as unknown as Chat

    if (!chat) {
      // no chat! create new
      sphinxLogger.info(`=> no chat! create new`)
      chat = await models.Chat.create({
        uuid: uuid,
        contactIds: JSON.stringify([
          owner_id,
          recipient_id,
        ]),
        createdAt: date,
        updatedAt: date,
        type: constants.chat_types.conversation,
        tenant: owner_id,
      }) as unknown as Chat
    }
  }
  return chat
}

export const sendContactKeys = async ({
  type,
  contactIds,
  sender,
  success,
  failure,
  dontActuallySendContactKey,
  contactPubKey,
  routeHint,
}: {
  type: number
  contactIds: number[]
  sender: any
  success?: ({ destination_key: string, amount: number }) => void
  failure?: (error: Error) => void
  dontActuallySendContactKey?: boolean
  contactPubKey?: string
  routeHint?: string
}): Promise<void> => {
  const msg = newkeyexchangemsg(
    type,
    sender,
    dontActuallySendContactKey || false
  )

  if (contactPubKey) {
    // dont use ids here
    performKeysendMessage({
      sender,
      destination_key: contactPubKey,
      amount: 3,
      msg,
      route_hint: routeHint,
      success,
      failure,
    })
    return
  }

  let yes: any = null
  let no: any = null
  const cids = contactIds || []

  await asyncForEach(cids, async (contactId) => {
    if (contactId == sender.id) {
      return
    }
    const contact = await models.Contact.findOne({ where: { id: contactId } }) as unknown as Contact
    if (!(contact && contact.publicKey)) return
    const destination_key: string = contact.publicKey
    const route_hint = contact.routeHint

    // console.log("=> KEY EXCHANGE", msg)
    // console.log("=> TO", destination_key, route_hint)
    await performKeysendMessage({
      sender,
      destination_key,
      amount: 3,
      msg,
      route_hint,
      success: (data) => {
        yes = data
      },
      failure: (error) => {
        no = error
      },
    })
    await sleep(1000)
  })
  if (no && failure) {
    failure(no)
  }
  if (!no && yes && success) {
    success(yes)
  }
}

export const performKeysendMessage = async ({
  destination_key,
  route_hint,
  amount,
  msg,
  success,
  failure,
  sender,
  extra_tlv,
}: {
  destination_key: string
  route_hint?: string
  amount: number
  msg: Partial<Msg>
  success?: (arg: {destination_key: string, amount: number} | boolean) => void
  failure?: (error: Error) => void
  sender: any
  extra_tlv?: { [k: string]: any }
}): Promise<void> => {
  const opts = {
    dest: destination_key,
    data: msg || {},
    amt: Math.max(amount, 3),
    route_hint,
    extra_tlv,
  }
  try {
    const r = await signAndSend(opts, sender)
    // console.log("=> keysend to new contact")
    if (success) success(r)
  } catch (e) {
    sphinxLogger.info(
      `KEYSEND MESSAGE ERROR to ${destination_key} ${e} ${opts}`,
      logging.Network
    )
    if (failure) failure(e)
  }
}

export async function findOrCreateContactByPubkeyAndRouteHint(
  senderPubKey: string,
  senderRouteHint: string,
  senderAlias: string,
  owner: Contact,
  realAmount: number
): Promise<Contact> {
  let sender = await models.Contact.findOne({
    where: { publicKey: senderPubKey, tenant: owner.id },
  }) as unknown as Contact
  if (!sender) {
    let unmet = false
    if (owner.priceToMeet) {
      if (realAmount < owner.priceToMeet) unmet = true
    }
    sender = await models.Contact.create({
      publicKey: senderPubKey,
      routeHint: senderRouteHint || '',
      alias: senderAlias || 'Unknown',
      status: 1,
      tenant: owner.id,
      unmet,
    }) as unknown as Contact
    sendContactKeys({
      contactIds: [sender.id],
      sender: owner,
      type: constants.message_types.contact_key,
    })
  } else {
    if (sender.unmet) {
      // update "unmet" if they pay enough second time
      if (owner.priceToMeet && realAmount >= owner.priceToMeet) {
        await sender.update({ unmet: false })
      }
    }
  }
  return sender
}

export async function findOrCreateChatByUUID(chat_uuid: string, contactIds: number[], tenant: number): Promise<ChatRecord> {
  let chat = await models.Chat.findOne({
    where: { uuid: chat_uuid, tenant, deleted: false },
  }) as unknown as ChatRecord
  if (!chat) {
    const date = new Date()
    date.setMilliseconds(0)
    chat = await models.Chat.create({
      uuid: chat_uuid,
      contactIds: JSON.stringify(contactIds || []),
      createdAt: date,
      updatedAt: date,
      type: 0, // conversation
      tenant,
    }) as unknown as ChatRecord
  }
  return chat
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function parseReceiveParams(payload: Payload): Promise<{
  chat_members: { [k: string]: ChatMember }
  owner: ContactRecord
  sender: ContactRecord
  chat: ChatRecord
  [k: string]: any
}> {
  const dat = payload
  const sender_pub_key = dat.sender.pub_key
  const sender_route_hint = dat.sender.route_hint
  const sender_alias = dat.sender.alias
  const sender_photo_url = dat.sender.photo_url || ''
  const chat_uuid = dat.chat.uuid
  const chat_type = dat.chat.type
  const chat_members: { [k: string]: any } = dat.chat.members || {}
  const chat_name = dat.chat.name
  const chat_key = dat.chat.groupKey
  const chat_host = dat.chat.host
  const amount = dat.message.amount
  const content = dat.message.content
  const remote_content = dat.message.remoteContent
  const message_status = dat.message.status
  const mediaToken = dat.message.mediaToken
  const originalMuid = dat.message.originalMuid
  const msg_id = dat.message.id || 0
  const msg_uuid = dat.message.uuid || ''
  const mediaKey = dat.message.mediaKey
  const mediaType = dat.message.mediaType
  const date_string = dat.message.date
  const skip_payment_processing = dat.message.skipPaymentProcessing
  const reply_uuid = dat.message.replyUuid
  const parent_id = dat.message.parentId
  const purchaser_id = dat.message.purchaser
  const network_type = dat.network_type || 0
  const isTribeOwner = dat.isTribeOwner ? true : false
  const dest = dat.dest

  const isConversation =
    !chat_type || (chat_type && chat_type == constants.chat_types.conversation)
  let sender: ContactRecord
  let chat: ChatRecord
  let owner: Contact = dat.owner
  if (!owner) {
    const ownerRecord = await models.Contact.findOne({
      where: { isOwner: true, publicKey: dest as string },
    }) as unknown as ContactRecord
    owner = ownerRecord.dataValues
  }
  if (!owner) sphinxLogger.error(`=> parseReceiveParams cannot find owner`)
  if (isConversation) {
    const realAmount =
      network_type === constants.network_types.lightning ? amount : 0
    sender = await findOrCreateContactByPubkeyAndRouteHint(
      sender_pub_key,
      sender_route_hint as string,
      sender_alias,
      owner,
      realAmount
    )
    chat = await findOrCreateChatByUUID(
      chat_uuid,
      [owner.id, sender.id],
      owner.id
    )
    if (sender.fromGroup) {
      // if a private msg received, update the contact
      await sender.update({ fromGroup: false })
    }
  } else {
    // group
    sender = await models.Contact.findOne({
      where: { publicKey: sender_pub_key, tenant: owner.id },
    }) as unknown as Contact
    // inject a "sender" with an alias
    if (!sender && chat_type == constants.chat_types.tribe) {
      sender = <ContactRecord>{ id: 0, alias: sender_alias }
    }
    chat = await models.Chat.findOne({
      where: { uuid: chat_uuid, tenant: owner.id },
    }) as unknown as Chat
  }
  return {
    owner: owner as ContactRecord,
    dest,
    sender,
    chat,
    sender_pub_key,
    sender_route_hint,
    sender_alias,
    isTribeOwner,
    chat_uuid,
    amount,
    content,
    mediaToken,
    mediaKey,
    mediaType,
    originalMuid,
    chat_type,
    msg_id,
    chat_members,
    chat_name,
    chat_host,
    chat_key,
    remote_content,
    msg_uuid,
    date_string,
    reply_uuid,
    parent_id,
    skip_payment_processing,
    purchaser_id,
    sender_photo_url,
    network_type,
    message_status,
  }
}

export async function asyncForEach<T>(array: T[], callback: (value: T, index: number, array: T[]) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function newkeyexchangemsg(type, sender, dontActuallySendContactKey) {
  const includePhotoUrl = sender && sender.photoUrl && !sender.privatePhoto
  return {
    type: type,
    sender: {
      pub_key: sender.publicKey,
      ...(sender.routeHint && { route_hint: sender.routeHint }),
      ...(!dontActuallySendContactKey && { contact_key: sender.contactKey }),
      ...(sender.alias && { alias: sender.alias }),
      ...(includePhotoUrl && { photo_url: sender.photoUrl }),
    },
  }
}
