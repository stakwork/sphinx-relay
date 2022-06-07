import { toSnake, toCamel } from '../utils/case'
import * as cronUtils from './cron'
import { Contact, Message, Chat, Subscription, Accounting, Bot, Invite } from '../models'

function chatToJson(c: Chat): { [k: string]: any } {
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
    contactIds,
  })
}

function messageToJson(msg: Message, chat?: Chat, contact?: Contact): { [k: string]: any } {
  if (!msg) return {}
  const message = msg.dataValues || msg
  let statusMap = message.statusMap || null
  if (message.statusMap && typeof message.statusMap === 'string') {
    statusMap = JSON.parse(message.statusMap)
  }
  return toSnake({
    ...message,
    // type: message.type ? parseInt(message.type) : 0,
    amount: message.amount ? parseInt(message.amount) : 0,
    amountMsat: message.amountMsat ? parseInt(message.amountMsat) : 0,
    statusMap,
    chat: chat ? chatToJson(chat) : null,
    contact: contact ? contactToJson(contact) : null,
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function anyToJson(obj: any, chat?: Chat): { [k: string]: any } {
  return messageToJson(obj, chat);
}

function contactToJson(contact: Contact): { [k: string]: any } {
  if (!contact) return {}
  return toSnake(contact.dataValues || contact)
}

const inviteToJson = (invite: Invite): { [k: string]: any } => toSnake(invite.dataValues || invite)

const botToJson = (bot: Bot): { [k: string]: any } => toSnake(bot.dataValues || bot)

const accountingToJson = (acc: Accounting): { [k: string]: any } => toSnake(acc.dataValues || acc)

const jsonToContact = (json: { [k: string]: any }): Contact => toCamel(json) as Contact

function subscriptionToJson(subscription: Subscription, chat?: Chat): { [k: string]: any } {
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
  anyToJson,
  contactToJson,
  inviteToJson,
  jsonToContact,
  chatToJson,
  subscriptionToJson,
  botToJson,
  accountingToJson,
}
