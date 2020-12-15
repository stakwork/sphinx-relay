import { models } from '../models'
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
export async function removeTimersByContactId(contactId) {
    const ts = await models.Timer.findAll({ where: { receiver: contactId } })
    ts.forEach(t => clearTimer(t))
    models.Timer.destroy({ where: { receiver: contactId } })
}
export async function removeTimersByContactIdChatId(contactId, chatId) {
    const ts = await models.Timer.findAll({ where: { receiver: contactId, chatId } })
    ts.forEach(t => clearTimer(t))
    models.Timer.destroy({ where: { receiver: contactId, chatId } })
}

export async function addTimer({ amount, millis, receiver, msgId, chatId }) {
    const now = new Date().valueOf()
    const when = now + millis
    const t = await models.Timer.create({
        amount, millis: when, receiver, msgId, chatId,
    })
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
    const timers = await models.Timer.findAll()
    timers && timers.forEach((t, i) => {
        const name = makeName(t)
        setTimer(name, t.millis, async () => {
            setTimeout(() => {
                payBack(t)
            }, i * 999) // dont do all at once
        })
    })
}
export async function payBack(t) {
    const chat = await models.Chat.findOne({ where: { id: t.chatId } })
    const owner = await models.Contact.findOne({ where: { isOwner: true } })
    if (!chat) {
        models.Timer.destroy({ where: { id: t.id } })
        return
    }
    const theChat = { ...chat.dataValues, contactIds: [t.receiver] }
    network.sendMessage({
        chat: theChat,
        sender: owner,
        message: { id: t.msgId, amount: t.amount },
        amount: t.amount,
        type: constants.message_types.repayment,
        realSatsContactId: t.receiver,
        success: function () {
            var date = new Date();
            date.setMilliseconds(0)
            models.Message.create({
                // chatId: chat.id,
                type: constants.message_types.repayment,
                sender: 1,
                receiver: t.receiver,
                date: date,
                amount: t.amount,
                createdAt: date,
                updatedAt: date,
                status: constants.statuses.received,
                network_type: constants.network_types.lightning
            })
        }
    })
    models.Timer.destroy({ where: { id: t.id } })
}
