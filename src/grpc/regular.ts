import * as bolt11 from '@boltz/bolt11'
import { models, Contact, Chat, Message } from '../models'
import * as socket from '../utils/socket'
import { sendNotification, sendInvoice } from '../hub'
import * as jsonUtils from '../utils/json'
import constants from '../constants'
import { sphinxLogger } from '../utils/logger'

const oktolog = true
export function loginvoice(response: { [k: string]: any }): void {
  if (!oktolog) return
  const r = JSON.parse(JSON.stringify(response))
  r.r_hash = ''
  r.r_preimage = ''
  r.htlcs = r.htlcs && r.htlcs.map((h) => ({ ...h, custom_records: {} }))
  sphinxLogger.info(
    `AN INVOICE WAS RECIEVED!!!=======================> ${JSON.stringify(
      r,
      null,
      2
    )}`
  )
}

export async function receiveNonKeysend(response: {
  [k: string]: any
}): Promise<void> {
  const decoded = bolt11.decode(response['payment_request'])
  const paymentHash =
    decoded.tags.find((t) => t.tagName === 'payment_hash')?.data || ''

  const settleDate = parseInt(response['settle_date'] + '000')

  const invoice: Message = (await models.Message.findOne({
    where: {
      type: constants.message_types.invoice,
      payment_request: response['payment_request'],
    },
  })) as Message
  if (invoice == null) {
    if (!decoded.payeeNodeKey)
      return sphinxLogger.error(`subscribeInvoices: cant get dest from pay req`)
    const owner: Contact = (await models.Contact.findOne({
      where: { isOwner: true, publicKey: decoded.payeeNodeKey },
    })) as Contact
    if (!owner) return sphinxLogger.error(`subscribeInvoices: no owner found`)
    const tenant: number = owner.id
    const payReq = response['payment_request']
    const amount = response['amt_paid_sat']
    if (process.env.HOSTING_PROVIDER === 'true') {
      sendInvoice(payReq, amount)
    }
    socket.sendJson(
      {
        type: 'invoice_payment',
        response: { invoice: payReq },
      },
      tenant
    )
    await models.Message.create({
      chatId: 0,
      type: constants.message_types.payment,
      sender: 0,
      amount: response['amt_paid_sat'],
      amountMsat: response['amt_paid_msat'],
      paymentHash: paymentHash,
      date: new Date(settleDate),
      messageContent: response['memo'],
      status: constants.statuses.confirmed,
      createdAt: new Date(settleDate),
      updatedAt: new Date(settleDate),
      network_type: constants.network_types.lightning,
      tenant,
    })
    return
  }
  // invoice is defined
  const tenant: number = invoice.tenant
  const owner: Contact = (await models.Contact.findOne({
    where: { id: tenant },
  })) as Contact
  models.Message.update(
    { status: constants.statuses.confirmed },
    { where: { id: invoice.id } }
  )

  const chat: Chat = (await models.Chat.findOne({
    where: { id: invoice.chatId, tenant },
  })) as Chat
  const contactIds = JSON.parse(chat.contactIds)
  const senderId = contactIds.find((id) => id != invoice.sender)

  const message: Message = (await models.Message.create({
    chatId: invoice.chatId,
    type: constants.message_types.payment,
    sender: senderId,
    amount: response['amt_paid_sat'],
    amountMsat: response['amt_paid_msat'],
    paymentHash: paymentHash,
    date: new Date(settleDate),
    messageContent: response['memo'],
    status: constants.statuses.confirmed,
    createdAt: new Date(settleDate),
    updatedAt: new Date(settleDate),
    network_type: constants.network_types.lightning,
    tenant,
  })) as Message

  const sender: Contact = (await models.Contact.findOne({
    where: { id: senderId, tenant },
  })) as Contact

  socket.sendJson(
    {
      type: 'payment',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )

  sendNotification(chat, sender.alias, 'message', owner)
}
