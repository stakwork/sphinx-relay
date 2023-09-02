import * as short from 'short-uuid'
import * as bolt11 from '@boltz/bolt11'
import { Response } from 'express'
import { models, MessageRecord, ChatRecord } from '../models'
import * as Lightning from '../grpc/lightning'
import * as interfaces from '../grpc/interfaces'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import { decodePaymentRequest } from '../utils/decode'
import * as helpers from '../helpers'
import { sendNotification } from '../hub'
import { success, failure } from '../utils/res'
import * as network from '../network'
import { Payload } from '../network'
import constants from '../constants'
import { sphinxLogger } from '../utils/logger'
import { Req } from '../types'
import { ChatPlusMembers } from '../network/send'
import { sendConfirmation } from './confirmations'

function stripLightningPrefix(s: string): string {
  if (s.toLowerCase().startsWith('lightning:')) return s.substring(10)
  return s
}

export const payInvoice = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const payment_request = stripLightningPrefix(req.body.payment_request)

  if (!payment_request) {
    sphinxLogger.error(`[pay invoice] "payment_request" is empty`)
    res.status(400)
    res.json({ success: false, error: 'payment_request is empty' })
    res.end()
    return
  }
  sphinxLogger.info(`[pay invoice] ${payment_request}`)
  sphinxLogger.info(`[pay invoice] => from ${tenant}`)

  try {
    sphinxLogger.info(`[pay invoice] => pubkey: ${req.owner.publicKey}`)
    const response = await Lightning.sendPayment(
      payment_request,
      req.owner.publicKey
    )

    sphinxLogger.info(`[pay invoice data] ${JSON.stringify(response)}`)

    const message: MessageRecord = (await models.Message.findOne({
      where: { payment_request, tenant },
    })) as MessageRecord
    if (!message) {
      // invoice still paid
      anonymousInvoice(res, payment_request, tenant)
      return
    }

    message.status = constants.statuses.confirmed
    message.save()

    const date = new Date()
    date.setMilliseconds(0)

    const chat: ChatRecord = (await models.Chat.findOne({
      where: { id: message.chatId, tenant },
    })) as ChatRecord
    const contactIds: number[] = JSON.parse(chat.contactIds)
    const senderId = contactIds.find((id) => id != message.sender)

    const paidMessage: MessageRecord = (await models.Message.create({
      chatId: message.chatId,
      sender: senderId,
      type: constants.message_types.payment,
      amount: message.amount,
      amountMsat: message.amountMsat,
      paymentHash: message.paymentHash,
      date: date,
      expirationDate: null,
      messageContent: null,
      status: constants.statuses.confirmed,
      createdAt: date,
      updatedAt: date,
      tenant,
    })) as MessageRecord
    sphinxLogger.info(`[pay invoice] stored message ${paidMessage}`)
    success(res, jsonUtils.messageToJson(paidMessage, chat))
  } catch (e) {
    sphinxLogger.error(`ERR paying invoice ${e}`)
    if (typeof e === 'string') {
      return failure(res, e)
    }
    return failure(res, e?.message || 'could not pay invoice')
  }
}

async function anonymousInvoice(
  res: Response,
  payment_request: string,
  tenant: number
): Promise<void> {
  const { memo, sat, msat, paymentHash, invoiceDate } =
    decodePaymentRequest(payment_request)
  const date = new Date()
  date.setMilliseconds(0)
  await models.Message.create({
    chatId: 0,
    type: constants.message_types.payment,
    sender: tenant,
    amount: sat,
    amountMsat: msat,
    paymentHash: paymentHash,
    date: new Date(invoiceDate),
    messageContent: memo,
    status: constants.statuses.confirmed,
    createdAt: date,
    updatedAt: date,
    tenant,
  })
  return success(res, {
    success: true,
    response: { payment_request },
  })
}

export const cancelInvoice = (req: Req, res: Response): void => {
  res.status(200)
  res.json({ success: false })
  res.end()
}

export const createInvoice = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const { amount, memo, remote_memo, chat_id, contact_id, expiry } = req.body

  const request: interfaces.AddInvoiceRequest = {
    value: amount,
    memo: remote_memo || memo,
  }
  if (req.owner && req.owner.routeHint && req.owner.routeHint.includes(':')) {
    const arr = req.owner.routeHint.split(':')
    const node_id = arr[0]
    const chan_id = arr[1]
    request.route_hints = [
      {
        hop_hints: [{ node_id, chan_id }],
      },
    ]
  }
  if (expiry) request.expiry = expiry

  if (amount == null) {
    res.status(200)
    res.json({ err: 'no amount specified' })
    res.end()
  } else {
    try {
      const response = await Lightning.addInvoice(request, req.owner.publicKey)
      const { payment_request } = response

      if (!contact_id && !chat_id) {
        // if no contact
        return success(res, {
          invoice: payment_request,
        })
      }

      const invoice = bolt11.decode(payment_request)
      if (invoice) {
        const paymentHash =
          invoice.tags.find((t) => t.tagName === 'payment_hash')?.data || ''

        sphinxLogger.info(`decoded pay req ${{ invoice }}`)

        const owner = req.owner

        const chat = await helpers.findOrCreateChat({
          chat_id,
          owner_id: owner.id,
          recipient_id: contact_id,
        })
        if (!chat) return failure(res, 'counldnt findOrCreateChat')

        const timestamp = parseInt(invoice.timestamp + '000')
        const expiry = parseInt(invoice.timeExpireDate + '000')

        const msg: any = {
          chatId: chat.id,
          uuid: short.generate(),
          sender: owner.id,
          type: constants.message_types.invoice,
          amount: invoice.satoshis || 0,
          amountMsat: parseInt(invoice.millisatoshis || '0') * 1000,
          paymentHash: paymentHash,
          paymentRequest: payment_request,
          date: new Date(timestamp),
          messageContent: memo,
          remoteMessageContent: remote_memo,
          status: constants.statuses.pending,
          createdAt: new Date(timestamp),
          updatedAt: new Date(timestamp),
          tenant,
        }
        if (invoice.timeExpireDate) {
          msg.expirationDate = new Date(expiry)
        }
        const message: MessageRecord = (await models.Message.create(
          msg
        )) as MessageRecord

        await network.sendMessage({
          chat: chat as Partial<ChatPlusMembers>,
          sender: owner,
          type: constants.message_types.invoice,
          message: {
            id: message.id,
            invoice: message.paymentRequest,
          },
        })

        success(res, jsonUtils.messageToJson(message, chat))
      }
    } catch (err) {
      sphinxLogger.error(`addInvoice error: ${err}`)
    }
  }
}

export const listInvoices = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')

  const lightning = await Lightning.loadLightning()

  // TODO ts complaining
  ;(<any>lightning).listInvoices({}, (err, response) => {
    sphinxLogger.info({ err, response })
    if (err == null) {
      res.status(200)
      res.json(response)
      res.end()
    } else {
      sphinxLogger.error({ err, response })
    }
  })
}

export async function getInvoice(req: Req, res: Response): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  const payment_request = req.query.payment_request as string

  if (!payment_request) {
    return failure(res, 'Invalid payment request')
  }
  try {
    const decodedPaymentRequest = bolt11.decode(payment_request)
    const payment_hash =
      (decodedPaymentRequest.tags.find((t) => t.tagName === 'payment_hash')
        ?.data as string) || ('' as string)
    const invoice = await Lightning.getInvoiceHandler(
      payment_hash,
      req.owner.publicKey
    )
    return success(res, invoice)
  } catch (error) {
    return failure(res, error)
  }
}

export const receiveInvoice = async (payload: Payload): Promise<void> => {
  sphinxLogger.info(`received invoice ${payload.message.invoice}`)

  const total_spent = 1
  const dat = payload
  const payment_request = dat.message.invoice
  const network_type = dat.network_type || 0
  const date = new Date()
  date.setMilliseconds(0)

  const {
    owner,
    sender,
    chat,
    msg_id,
    chat_type,
    sender_alias,
    msg_uuid,
    sender_photo_url,
    person,
  } = await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return sphinxLogger.error(`=> no group chat!`)
  }
  const tenant: number = owner.id

  const { memo, sat, msat, paymentHash, invoiceDate, expirationSeconds } =
    decodePaymentRequest(payment_request)

  const msg: { [k: string]: any } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.invoice,
    sender: sender.id,
    amount: sat,
    amountMsat: msat,
    paymentRequest: payment_request,
    asciiEncodedTotal: total_spent,
    paymentHash: paymentHash,
    messageContent: memo,
    expirationDate: new Date(invoiceDate + expirationSeconds),
    date: new Date(invoiceDate),
    status: constants.statuses.pending,
    createdAt: date,
    updatedAt: date,
    network_type: network_type,
    tenant,
  }
  if (person) msg.person = person
  const isTribe = chat_type === constants.chat_types.tribe
  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
  }
  const message: MessageRecord = (await models.Message.create(
    msg
  )) as MessageRecord
  sphinxLogger.info(`received keysend invoice message ${message.id}`)

  socket.sendJson(
    {
      type: 'invoice',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )

  sendNotification(chat, msg.senderAlias || sender.alias, 'message', owner)

  sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
}
