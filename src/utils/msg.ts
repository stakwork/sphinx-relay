import * as rsa from '../crypto/rsa'
import constants from '../constants'
import { Msg, MessageContent, ChatContent } from '../network/interfaces'
import * as models from '../models'
import { ChatMemberRecord } from '../models'
import { logging, sphinxLogger } from '../utils/logger'
import { tokenFromTerms } from './ldat'

function addInRemoteText(full: Partial<Msg>, contactId, isTribe: boolean): Msg {
  const m = full && full.message
  if (!(m && m.content)) return full as Msg
  if (!(typeof m.content === 'object')) return full as Msg
  if (isTribe) {
    // if just one, send it (for tribe remote_text_map... is there a better way?)
    if (m.content['chat']) {
      return fillmsg(full, { content: m.content['chat'] })
    }
  }
  return fillmsg(full, { content: m.content[contactId + ''] })
}

function removeRecipientFromChatMembers(
  full: Partial<Msg>,
  destkey: string
): Msg {
  const c = full && full.chat
  if (!(c && c.members)) return full as Msg
  if (!(typeof c.members === 'object')) return full as Msg

  const members = { ...c.members }
  if (members[destkey]) delete members[destkey]
  return fillchatmsg(full, { members })
}

function removeAllNonAdminMembersIfTribe(
  full: Partial<Msg>,
  destkey: string
): Msg {
  return full as Msg
  // const c = full && full.chat
  // if (!(c && c.members)) return full
  // if (!(typeof c.members==='object')) return full

  // const members = {...c.members}
  // if(members[destkey]) delete members[destkey]
  // return fillchatmsg(full, {members})
}

// THIS IS ONLY FOR TRIBE OWNER
// by this time the content and mediaKey are already in message as string
async function encryptTribeBroadcast(
  full: Partial<Msg>,
  contact: models.Contact,
  isTribeOwner: boolean
): Promise<Msg> {
  if (!isTribeOwner) return full as Msg

  const chat = full && full.chat
  const message = full && full.message
  if (!message || !(chat && chat.type && chat.uuid)) return full as Msg
  const obj: Partial<MessageContent> = {}
  if (isTribeOwner) {
    // has been previously decrypted
    if (message.content) {
      const encContent = rsa.encrypt(
        contact.contactKey,
        message.content.toString()
      )
      obj.content = encContent
    }
    if (message.mediaKey) {
      const encMediaKey = rsa.encrypt(contact.contactKey, message.mediaKey)
      obj.mediaKey = encMediaKey
    }
  }
  return fillmsg(full, obj)
}

function addInMediaKey(
  full: Partial<Msg>,
  contactId: number,
  isTribe: boolean
): Msg {
  const m = full && full.message
  if (!(m && m.mediaKey)) return full as Msg
  if (!(m && m.mediaTerms)) return full as Msg
  if (!(typeof m.mediaKey === 'object')) return full as Msg

  if (isTribe) {
    if (m.mediaKey['chat']) {
      // "chat" is the key for tribes
      const tribeMediaKey = m.mediaTerms.skipSigning ? '' : m.mediaKey['chat']
      return fillmsg(full, { mediaKey: tribeMediaKey })
    }
  }
  const mediaKey = m.mediaTerms.skipSigning ? '' : m.mediaKey[contactId + '']
  return fillmsg(full, { mediaKey })
}

// add the token if its free, but if a price just the base64(host).muid
async function finishTermsAndReceipt(
  full: Partial<Msg>,
  destkey: string,
  senderPubkey: string
): Promise<Msg> {
  const m = full && full.message
  if (!(m && m.mediaTerms)) return full as Msg

  const t = m.mediaTerms
  const meta = t.meta || {}
  t.ttl = t.ttl || 31536000
  meta.ttl = t.ttl
  const mediaToken = await tokenFromTerms({
    host: t.host || '',
    muid: t.muid,
    ttl: t.skipSigning ? 0 : t.ttl,
    pubkey: t.skipSigning ? '' : destkey,
    meta,
    ownerPubkey: senderPubkey,
  })
  const fullmsg = fillmsg(full, { mediaToken })
  delete fullmsg.message.mediaTerms
  return fullmsg
}

// this is only for tribes
// DECRYPT EITHER STRING OR FIRST VAL IN OBJ
async function decryptMessage(
  full: Partial<Msg>,
  chat: Partial<models.Chat>
): Promise<Msg> {
  if (!chat.groupPrivateKey) return full as Msg
  const m = full && full.message
  if (!m) return full as Msg

  const obj: Partial<MessageContent> = {}
  if (m.content) {
    let content = m.content
    if (typeof m.content === 'object') {
      if (m.content['chat']) {
        content = m.content['chat']
      }
    }
    const decContent = rsa.decrypt(chat.groupPrivateKey, content.toString())
    obj.content = decContent
  }
  if (m.mediaKey) {
    let mediaKey = m.mediaKey
    if (typeof m.mediaKey === 'object') {
      if (m.mediaKey['chat']) {
        mediaKey = m.mediaKey['chat']
      }
    }
    const decMediaKey = rsa.decrypt(chat.groupPrivateKey, mediaKey)
    obj.mediaKey = decMediaKey
  }
  if (m.mediaTerms) {
    let mediaToken = await tokenFromTerms({
      host: m.mediaTerms.host,
      muid: m.mediaTerms.muid,
      ttl: m.mediaTerms.ttl,
      meta: m.mediaTerms.meta,
      pubkey: full.sender?.pub_key,
      ownerPubkey: full.sender?.pub_key,
    })
    obj.mediaToken = mediaToken
  }

  // console.log("OBJ FILLED",fillmsg(full, obj))
  return fillmsg(full, obj)
}

async function personalizeMessage(
  m: Msg,
  contact: models.Contact,
  isTribeOwner: boolean
): Promise<Msg> {
  const contactId = contact.id
  const destkey = contact.publicKey
  const senderPubkey = m.sender.pub_key

  const cloned: Msg = JSON.parse(JSON.stringify(m))

  const chat = cloned && cloned.chat
  const isTribe =
    (chat.type && chat.type === constants.chat_types.tribe) || false

  const msgWithRemoteTxt = addInRemoteText(cloned, contactId, isTribe)
  const cleanMsg = removeRecipientFromChatMembers(msgWithRemoteTxt, destkey)
  const cleanerMsg = removeAllNonAdminMembersIfTribe(cleanMsg, destkey)
  const msgWithMediaKey = addInMediaKey(cleanerMsg, contactId, isTribe)
  const msgWithMediaToken = await finishTermsAndReceipt(
    msgWithMediaKey,
    destkey,
    senderPubkey
  )
  const encMsg = await encryptTribeBroadcast(
    msgWithMediaToken,
    contact,
    isTribeOwner
  )
  return encMsg
}

export function fillmsg(
  full: Partial<Msg>,
  props: Partial<MessageContent>
): Msg {
  return {
    ...full,
    message: {
      ...full.message,
      ...props,
    },
  } as Msg
}

function fillchatmsg(full: Partial<Msg>, props: Partial<ChatContent>): Msg {
  return {
    ...full,
    chat: {
      ...full.chat,
      ...props,
    },
  } as Msg
}

async function recordLeadershipScore(tenant, amount, chatId, contactId, type) {
  try {
    const receiver = (await models.ChatMember.findOne({
      where: {
        contactId: contactId,
        tenant,
        chatId: chatId!,
      },
    })) as ChatMemberRecord

    if (type === constants.message_types.boost) {
      await receiver?.update({
        totalEarned: receiver.totalEarned + amount,
        reputation: receiver.reputation + 3,
      })
    } else {
      await receiver?.update({
        totalEarned: receiver.totalEarned + amount,
      })
    }
  } catch (error) {
    sphinxLogger.error(
      `=> Could not update the totalEarned column on the ChatMember table for Leadership board record ${error}`,
      logging.Network
    )
  }
}

export {
  personalizeMessage,
  decryptMessage,
  encryptTribeBroadcast,
  recordLeadershipScore,
}
