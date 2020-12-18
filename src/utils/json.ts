import { toSnake, toCamel } from '../utils/case'
import * as cronUtils from './cron'

function chatToJson(c) {
  if (!c) return {}
  const ch = c.dataValues || c
  const chat = JSON.parse(JSON.stringify(ch))
  let contactIds = chat.contactIds || null
  if (chat.contactIds && typeof chat.contactIds === 'string') {
    contactIds = JSON.parse(chat.contactIds)
  }
  delete chat.groupPrivateKey
  return toSnake({
    ...chat,
    contactIds
  })
}

function messageToJson(msg, chat, contact?) {
  if (!msg) return {}
  const message = msg.dataValues || msg
  let statusMap = message.statusMap || null
  if (message.statusMap && typeof message.statusMap === 'string') {
    statusMap = JSON.parse(message.statusMap)
  }
  return toSnake({
    ...message,
    amount: message.amount ? parseInt(message.amount) : 0,
    amountMsat: message.amountMsat ? parseInt(message.amountMsat) : 0,
    statusMap,
    chat: chat ? chatToJson(chat) : null,
    contact: contact ? contactToJson(contact) : null
  })
}

function contactToJson(contact) {
  if (!contact) return {}
  return toSnake(contact.dataValues || contact)
}

const inviteToJson = (invite) => toSnake(invite.dataValues || invite)

const botToJson = (bot) => toSnake(bot.dataValues || bot)

const accountingToJson = (acc) => toSnake(acc.dataValues || acc)

const jsonToContact = (json) => toCamel(json)

function subscriptionToJson(subscription, chat) {
  const sub = subscription.dataValues || subscription
  const { interval, next } = cronUtils.parse(sub.cron)
  return toSnake({
    ...sub,
    interval,
    next,
    chat: chat ? chatToJson(chat) : null,
  })
}

export {
  messageToJson,
  contactToJson,
  inviteToJson,
  jsonToContact,
  chatToJson,
  subscriptionToJson,
  botToJson,
  accountingToJson
}
