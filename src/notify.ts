import { logging } from './utils/logger'
import { models, Contact, Chat } from './models'
import fetch from 'node-fetch'
import { Op } from 'sequelize'
import constants from './constants'
import { sphinxLogger } from './utils/logger'

type NotificationType =
  | 'group_join'
  | 'group_leave'
  | 'badge'
  | 'invite'
  | 'message'
  | 'reject'
  | 'keysend'
  | 'boost'

// VoipNotification ONLY in 1-1 conversations
interface VoipNotification {
  caller_name: string
  link_url: string // this is the encrypted message content
}
interface VoipParams {
  device_id: string
  type: string // "incoming_call"
  notification: VoipNotification
}

interface Notification {
  message?: string
  sound?: string
  badge?: number
}
interface Params {
  device_id: string
  notification: Notification
}

export function sendVoipNotification(
  owner: Contact,
  notification: VoipNotification
) {
  const params = {
    device_id: owner.pushKitToken,
    type: 'incoming_call',
    notification,
  }
  triggerVoipNotification(params)
}

export const sendNotification = async (
  chat: Chat,
  name: string,
  type: NotificationType,
  owner: Contact,
  amount?: number,
  push?: boolean
): Promise<void> => {
  if (!owner) return sphinxLogger.error(`=> sendNotification error: no owner`)

  let message = `You have a new message from ${name}`
  if (type === 'invite') {
    message = `Your invite to ${name} is ready`
  }
  if (type === 'group_join') {
    message = `Someone joined ${name}`
  }
  if (type === 'group_leave') {
    message = `Someone left ${name}`
  }
  if (type === 'reject') {
    message = `The admin has declined your request to join "${name}"`
  }
  if (type === 'keysend') {
    message = `You have received a payment of ${amount} sats`
  }

  // group
  if (
    type === 'message' &&
    chat.type == constants.chat_types.group &&
    chat.name &&
    chat.name.length
  ) {
    message += ` in ${chat.name}`
  }

  // tribe
  if (
    (type === 'message' || type === 'boost') &&
    chat.type === constants.chat_types.tribe
  ) {
    message = `You have a new ${type}`
    if (chat.name && chat.name.length) {
      message += ` in ${chat.name}`
    }
  }

  if (!owner.deviceId) {
    if (logging.Notification)
      // sphinxLogger.info(`[send notification] skipping. owner.deviceId not set.`)
      return
  }
  const device_id = owner.deviceId
  const isIOS = device_id.length === 64
  const isAndroid = !isIOS

  const params: Params = { device_id, notification: {} }
  const notification: { [k: string]: string | number } = {
    chat_id: chat.id || 0,
    sound: '',
  }
  let chatIsMuted = chat.notify === constants.notify_levels.mute
  if (chat.notify === constants.notify_levels.mentions && !push) {
    chatIsMuted = true
  }
  if (type !== 'badge' && !chatIsMuted) {
    notification.message = message
    notification.sound = owner.notificationSound || 'default'
  } else {
    if (isAndroid) return // skip on Android if no actual message
  }
  params.notification = notification

  // const isTribeOwner = chat.ownerPubkey === owner.publicKey
  if (type === 'message' && chat.type == constants.chat_types.tribe) {
    debounce(
      () => {
        const count = tribeCounts[chat.id] ? tribeCounts[chat.id] + ' ' : ''
        params.notification.message = chatIsMuted
          ? ''
          : `You have ${count}new messages in ${chat.name}`
        finalNotification(owner.id, params)
      },
      chat.id,
      30000
    )
  } else if (chat.type == constants.chat_types.conversation) {
    try {
      const cids = JSON.parse(chat.contactIds || '[]')
      const notme = cids.find((id) => id !== 1)
      const other: Contact = (await models.Contact.findOne({
        where: { id: notme },
      })) as Contact
      if (other.blocked) return
      finalNotification(owner.id, params)
    } catch (e) {
      sphinxLogger.error(`=> notify conversation err ${e}`)
    }
  } else {
    finalNotification(owner.id, params)
  }
}

// const typesToNotNotify = [
//   constants.message_types.group_join,
//   constants.message_types.group_leave,
//   constants.message_types.boost,
// ];

async function finalNotification(ownerID: number, params: Params) {
  if (params.notification.message) {
    if (logging.Notification)
      sphinxLogger.info(`[send notification] ${params.notification}`)
  }
  const unseen = await countUnseen(ownerID)
  // if(!unseenMessages) return
  if (!unseen) {
    params.notification.message = ''
    params.notification.sound = ''
  }
  params.notification.badge = unseen
  triggerNotification(params)
}

async function countUnseen(ownerID: number): Promise<number> {
  const unmutedChats = (await models.Chat.findAll({
    where: {
      tenant: ownerID,
      notify: constants.notify_levels.all,
    },
  })) as Chat[]
  const unmutedChatIds = (unmutedChats && unmutedChats.map((mc) => mc.id)) || []
  const unseenMessages = await models.Message.count({
    where: {
      sender: { [Op.ne]: ownerID },
      seen: false,
      chatId: unmutedChatIds,
      tenant: ownerID,
    },
  })

  const mentionChats = (await models.Chat.findAll({
    where: {
      tenant: ownerID,
      notify: constants.notify_levels.mentions,
    },
  })) as Chat[]
  const mentionChatIds = (mentionChats && mentionChats.map((mc) => mc.id)) || []
  const unseenMentions = await models.Message.count({
    where: {
      sender: { [Op.ne]: ownerID },
      seen: false,
      push: true,
      chatId: mentionChatIds,
      tenant: ownerID,
    },
  })

  return unseenMessages + unseenMentions
}

function triggerNotification(params: Params) {
  fetch('https://hub.sphinx.chat/api/v1/nodes/notify', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  }).catch((error) => {
    sphinxLogger.error(`[hub error]: triggerNotification ${error}`)
  })
}

function triggerVoipNotification(params: VoipParams) {
  fetch('https://hub.sphinx.chat/api/v1/nodes/notify', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  }).catch((error) => {
    sphinxLogger.error(`[hub error]: triggerVoipNotification ${error}`)
  })
}

const bounceTimeouts = {}
const tribeCounts = {}
function debounce(func, id, delay) {
  const context = this
  const args = arguments
  if (bounceTimeouts[id]) clearTimeout(bounceTimeouts[id])
  if (!tribeCounts[id]) tribeCounts[id] = 0
  tribeCounts[id] += 1
  bounceTimeouts[id] = setTimeout(() => {
    func.apply(context, args)
    // setTimeout(()=> tribeCounts[id]=0, 15)
    tribeCounts[id] = 0
  }, delay)
}

export function resetNotifyTribeCount(chatID: number): void {
  tribeCounts[chatID] = 0
}
