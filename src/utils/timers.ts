import { models, ContactRecord, Timer, ChatRecord } from '../models'
import { ChatPlusMembers } from '../network/send'
import * as network from '../network'
import constants from '../constants'

const timerz = {}
function clearTimer(t) {
  const name = makeName(t)
  if (name) clearTimeout(timerz[name])
}
export async function removeTimerByMsgId(msgId) {
  const t = await models.Timer.findOne({ where: { msgId } })
  clearTimer(t)
  models.Timer.destroy({ where: { msgId } })
}
export async function removeTimersByContactId(contactId, tenant) {
  const ts = await models.Timer.findAll({
    where: { receiver: contactId, tenant },
  })
  ts.forEach((t) => clearTimer(t))
  models.Timer.destroy({ where: { receiver: contactId, tenant } })
}
export async function removeTimersByContactIdChatId(contactId, chatId, tenant) {
  const ts = await models.Timer.findAll({
    where: { receiver: contactId, chatId, tenant },
  })
  ts.forEach((t) => clearTimer(t))
  models.Timer.destroy({ where: { receiver: contactId, chatId, tenant } })
}

export async function addTimer({
  amount,
  millis,
  receiver,
  msgId,
  chatId,
  tenant,
}) {
  const now = new Date().valueOf()
  const when = now + millis
  const t: Timer = (await models.Timer.create({
    amount,
    millis: when,
    receiver,
    msgId,
    chatId,
    tenant,
  })) as Timer
  setTimer(makeName(t), when, async () => {
    payBack(t)
  })
}
export function setTimer(name: string, when: number, cb) {
  const now = new Date().valueOf()
  const ms = when - now
  if (ms < 0) {
    cb() // fire right away if its already passed
  } else {
    timerz[name] = setTimeout(cb, ms)
  }
}
function makeName(t) {
  if (!t) return ''
  return `${t.chatId}_${t.receiver}_${t.msgId}`
}

export async function reloadTimers() {
  const timers: Timer[] = (await models.Timer.findAll()) as Timer[]
  timers &&
    timers.forEach((t, i) => {
      const name = makeName(t)
      setTimer(name, t.millis, async () => {
        setTimeout(() => {
          payBack(t)
        }, i * 999) // dont do all at once
      })
    })
}
export async function payBack(t: Timer) {
  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id: t.chatId, tenant: t.tenant },
  })) as ChatRecord
  const owner: ContactRecord = (await models.Contact.findOne({
    where: { id: t.tenant },
  })) as ContactRecord
  if (!chat) {
    models.Timer.destroy({ where: { id: t.id } })
    return
  }

  const contactIds: string = '[' + parseInt(t.receiver + '') + ']'

  const theChat: Partial<ChatPlusMembers> = {
    ...chat.dataValues,
    contactIds: contactIds,
  }
  network.sendMessage({
    chat: theChat,
    sender: owner,
    message: { id: t.msgId, amount: t.amount },
    amount: t.amount,
    type: constants.message_types.repayment,
    realSatsContactId: t.receiver,
    success: function () {
      const date = new Date()
      date.setMilliseconds(0)
      models.Message.create({
        // chatId: chat.id,
        type: constants.message_types.repayment,
        sender: t.tenant,
        receiver: t.receiver,
        date: date,
        amount: t.amount,
        createdAt: date,
        updatedAt: date,
        status: constants.statuses.received,
        network_type: constants.network_types.lightning,
        tenant: t.tenant,
      })
    },
  })
  models.Timer.destroy({ where: { id: t.id } })
}
