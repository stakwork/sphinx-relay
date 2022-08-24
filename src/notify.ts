import { logging } from './utils/logger'
import { models } from './models'
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
  chat,
  name,
  type: NotificationType,
  owner,
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
      sphinxLogger.info(`[send notification] skipping. owner.deviceId not set.`)
    return
  }
  const device_id = owner.deviceId
  const isIOS = device_id.length === 64
  const isAndroid = !isIOS

  const params: { [k: string]: any } = { device_id }
  const notification: { [k: string]: any } = {
    chat_id: chat.id || 0,
    sound: '',
  }
  let chatIsMuted = chat.isMuted || chat.notify === constants.notify_levels.mute
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
        finalNotification(owner.id, params, push)
      },
      chat.id,
      30000
    )
  } else if (chat.type == constants.chat_types.conversation) {
    try {
      const cids = JSON.parse(chat.contactIds || '[]')
      const notme = cids.find((id) => id !== 1)
      const other = models.Contact.findOne({ where: { id: notme } })
      if (other.blocked) return
      finalNotification(owner.id, params, push)
    } catch (e) {
      sphinxLogger.error(`=> notify conversation err ${e}`)
    }
  } else {
    finalNotification(owner.id, params, push)
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
  push?: boolean
) {
  if (params.notification.message) {
    if (logging.Notification)
      sphinxLogger.info(`[send notification] ${params.notification}`)
  }
  const mutedAtLeast = push
    ? constants.notify_levels.mute
    : constants.notify_levels.mentions
  const query = {
    [Op.or]: [
      {
        isMuted: true,
      },
      {
        notify: { [Op.gte]: mutedAtLeast },
      },
    ],
  }
  const mutedChats = await models.Chat.findAll({
    where: { query },
  })
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

export function resetNotifyTribeCount(chatID: number) {
  tribeCounts[chatID] = 0
}
