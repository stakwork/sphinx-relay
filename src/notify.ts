import { logging } from './utils/logger'
import { Contact, Chat, models } from './models'
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

const sendNotification = async (
  chat: Chat | undefined,
  name: string,
  type: NotificationType,
  owner: Contact,
  amount?: number
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

  if (!chat) return sphinxLogger.error(`=> sendNotification error: no chat NotificationType ${type}`)

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
      sphinxLogger.info(`[send notification] skipping. owner.deviceId not set.`)
    return
  }
  const device_id = owner.deviceId
  const isIOS = device_id.length === 64
  const isAndroid = !isIOS

  const params: { [k: string]: any } = { device_id }
  const notification: {
    chat_id: number,
    sound: string,
    message?: string
  } = {
    chat_id: chat.id || 0,
    sound: '',
  }
  if (type !== 'badge' && !chat.isMuted) {
    notification.message = message
    notification.sound = owner.notificationSound || 'default'
  } else {
    if (isAndroid) return // skip on Android if no actual message
  }
  params.notification = notification

  const isTribeOwner = chat.ownerPubkey === owner.publicKey
  if (type === 'message' && chat.type == constants.chat_types.tribe) {
    debounce(
      () => {
        const count = tribeCounts[chat.id] ? tribeCounts[chat.id] + ' ' : ''
        params.notification.message = chat.isMuted
          ? ''
          : `You have ${count}new message${tribeCounts[chat.id] == 1 ? '' : 's'} in ${chat.name}`
        finalNotification(owner.id, params, isTribeOwner)
      },
      chat.id,
      30000
    )
  } else if (chat.type == constants.chat_types.conversation) {
    try {
      const cids: number[] = JSON.parse(chat && chat.contactIds || '[]')
      const notme = cids.find((id) => id !== 1)
      if (notme === undefined) return
      const other = models.Contact.findOne({ where: { id: notme } }) as unknown as Contact
      if (other.blocked) return
      finalNotification(owner.id, params, isTribeOwner)
    } catch (e) {
      sphinxLogger.error(`=> notify conversation err ${e}`)
    }
  } else {
    finalNotification(owner.id, params, isTribeOwner)
  }
}

// const typesToNotNotify = [
//   constants.message_types.group_join,
//   constants.message_types.group_leave,
//   constants.message_types.boost,
// ];

async function finalNotification(
  ownerID: number,
  params: { [k: string]: any },
  isTribeOwner: boolean
) {
  if (params.notification.message) {
    if (logging.Notification)
      sphinxLogger.info(`[send notification] ${params.notification}`)
  }
  const mutedChats = await models.Chat.findAll({
    where: { isMuted: true },
  }) as unknown as Chat[]
  const mutedChatIds = (mutedChats && mutedChats.map((mc) => mc.id)) || []
  mutedChatIds.push(0) // no msgs in non chat (anon keysends)
  const where: { [k: string]: any } = {
    sender: { [Op.ne]: ownerID },
    seen: false,
    chatId: { [Op.notIn]: mutedChatIds },
    tenant: ownerID,
  }
  // if (!isTribeOwner) {
  //   where.type = { [Op.notIn]: typesToNotNotify };
  // }
  const unseenMessages = await models.Message.count({
    where,
  })
  // if(!unseenMessages) return
  if (!unseenMessages) {
    params.notification.message = ''
    params.notification.sound = ''
  }
  params.notification.badge = unseenMessages
  triggerNotification(params)
}

function triggerNotification(params: { [k: string]: any }) {
  fetch('https://hub.sphinx.chat/api/v1/nodes/notify', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  }).catch((error) => {
    sphinxLogger.error(`[hub error]: triggerNotification ${error}`)
  })
}

export { sendNotification }

const bounceTimeouts = {}
const tribeCounts = {}
function debounce(func: () => void, id: number, delay: number) {
  if (bounceTimeouts[id]) clearTimeout(bounceTimeouts[id])
  if (!tribeCounts[id]) tribeCounts[id] = 0
  tribeCounts[id] += 1
  bounceTimeouts[id] = setTimeout(() => {
    func()
    tribeCounts[id] = 0
  }, delay)
}

export function resetNotifyTribeCount(chatID: number): void {
  tribeCounts[chatID] = 0
}
