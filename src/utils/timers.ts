import { Timer, Chat, Contact, Message, models } from '../models'
import * as network from '../network'
import constants from '../constants'

const timerz: { [k: string]: NodeJS.Timeout } = {}

function clearTimer(t: Timer) {
  const name = makeName(t)
  if (name) clearTimeout(timerz[name])
}

export async function removeTimerByMsgId(msgId: number): Promise<void> {
  const t = await models.Timer.findOne({ where: { msgId } }) as unknown as Timer
  clearTimer(t)
  models.Timer.destroy({ where: { msgId } })
}

export async function removeTimersByContactId(contactId: number, tenant: number): Promise<void> {
  const ts = await models.Timer.findAll({
    where: { receiver: contactId, tenant },
  }) as unknown as Timer[]
  ts.forEach((t) => clearTimer(t))
  models.Timer.destroy({ where: { receiver: contactId, tenant } })
}

export async function removeTimersByContactIdChatId(contactId: number, chatId: number, tenant: number): Promise<void> {
  const ts = await models.Timer.findAll({
    where: { receiver: contactId, chatId, tenant },
  }) as unknown as Timer[]
  ts.forEach((t) => clearTimer(t))
  models.Timer.destroy({ where: { receiver: contactId, chatId, tenant } })
}

export async function addTimer({
  amount,
  millis,
  receiver,
  msgId,
  chatId,
  tenant
}: Timer): Promise<void> {
  const now = new Date().valueOf()
  const when = now + millis
  const t = await models.Timer.create({
    amount,
    millis: when,
    receiver,
    msgId,
    chatId,
    tenant,
  }) as unknown as Timer
  setTimer(makeName(t), when, async () => {
    payBack(t)
  })
}

export function setTimer(name: string, when: number, cb: () => void): void {
  const now = new Date().valueOf()
  const ms = when - now
  if (ms < 0) {
    cb() // fire right away if its already passed
  } else {
    timerz[name] = setTimeout(cb, ms)
  }
}

function makeName(t: Timer): string {
  if (!t) return ''
  return `${t.chatId}_${t.receiver}_${t.msgId}`
}

export async function reloadTimers(): Promise<void> {
  const timers = await models.Timer.findAll() as unknown as Timer[]
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

export async function payBack(t: Timer): Promise<void> {
  const chat = await models.Chat.findOne({
    where: { id: t.chatId, tenant: t.tenant },
  }) as unknown as Chat
  const owner = await models.Contact.findOne({ where: { id: t.tenant } }) as unknown as Contact
  if (!chat) {
    models.Timer.destroy({ where: { id: t.id } })
    return
  }
  const theChat = { ...chat.dataValues as Chat, contactIds: JSON.stringify([t.receiver]) }
  network.sendMessage({
    chat: theChat,
    sender: owner,
    message: { id: t.msgId, amount: t.amount } as unknown as Message,
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
      }) as unknown as Message
    },
  })
  models.Timer.destroy({ where: { id: t.id } })
}
