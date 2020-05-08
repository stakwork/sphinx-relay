import {toSnake,toCamel} from '../utils/case'
import * as cronUtils from './cron'

function chatToJson(c) {
  const ch = c.dataValues||c
  const chat = JSON.parse(JSON.stringify(ch))
  let contactIds = chat.contactIds || null
  if(chat.contactIds && typeof chat.contactIds==='string'){
    contactIds = JSON.parse(chat.contactIds)
  }
  delete chat.groupPrivateKey
  return toSnake({
    ...chat,
    contactIds
  })
}

function messageToJson(msg, chat, contact?) {
  const message = msg.dataValues||msg
  let statusMap = message.statusMap || null
  if(message.statusMap && typeof message.statusMap==='string'){
    statusMap = JSON.parse(message.statusMap)
  }
  return toSnake({
    ...message,
    statusMap,
    chat: chat ? chatToJson(chat) : null,
    contact: contact ? contactToJson(contact) : null
  })
}

const contactToJson = (contact) => toSnake(contact.dataValues||contact)

const inviteToJson = (invite) => toSnake(invite.dataValues||invite)

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
}
