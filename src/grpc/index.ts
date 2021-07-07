import { models } from '../models'
import * as socket from '../utils/socket'
import { sendNotification, sendInvoice } from '../hub'
import * as jsonUtils from '../utils/json'
import * as decodeUtils from '../utils/decode'
import { loadLightning, decodePayReq } from '../utils/lightning'
import * as network from '../network'
import * as moment from 'moment'
import constants from '../constants'
import { tryToUnlockLND } from '../utils/unlock'

const ERR_CODE_UNAVAILABLE = 14
const ERR_CODE_STREAM_REMOVED = 2
const ERR_CODE_UNIMPLEMENTED = 12 // locked

const oktolog = false
function loginvoice(response) {
  if (!oktolog) return
  const r = JSON.parse(JSON.stringify(response))
  r.r_hash = ''
  r.r_preimage = ''
  r.htlcs = r.htlcs && r.htlcs.map((h) => ({ ...h, custom_records: {} }))
  console.log(
    'AN INVOICE WAS RECIEVED!!!=======================>',
    JSON.stringify(r, null, 2)
  )
}

export function subscribeInvoices(parseKeysendInvoice) {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true) // try proxy

    var call = lightning.subscribeInvoices()
    call.on('data', async function (response) {
      loginvoice(response)
      if (response['state'] !== 'SETTLED') {
        return
      }
      // console.log("IS KEYSEND", response.is_keysend)
      if (response.is_keysend) {
        parseKeysendInvoice(response)
      } else {
        let decodedPaymentRequest = decodeUtils.decode(
          response['payment_request']
        )
        var paymentHash = ''
        for (var i = 0; i < decodedPaymentRequest['data']['tags'].length; i++) {
          let tag = decodedPaymentRequest['data']['tags'][i]
          if (tag['description'] == 'payment_hash') {
            paymentHash = tag['value']
            break
          }
        }

        let settleDate = parseInt(response['settle_date'] + '000')

        const invoice = await models.Message.findOne({
          where: {
            type: constants.message_types.invoice,
            payment_request: response['payment_request'],
          },
        })
        if (invoice == null) {
          const invoice: any = await decodePayReq(response['payment_request'])
          if (!invoice)
            return console.log("subscribeInvoices: couldn't decode pay req")
          if (!invoice.destination)
            return console.log('subscribeInvoices: cant get dest from pay req')
          const owner = await models.Contact.findOne({
            where: { isOwner: true, publicKey: invoice.destination },
          })
          if (!owner) return console.log('subscribeInvoices: no owner found')
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
        const owner = await models.Contact.findOne({ where: { id: tenant } })
        models.Message.update(
          { status: constants.statuses.confirmed },
          { where: { id: invoice.id } }
        )

        const chat = await models.Chat.findOne({
          where: { id: invoice.chatId, tenant },
        })
        const contactIds = JSON.parse(chat.contactIds)
        const senderId = contactIds.find((id) => id != invoice.sender)

        const message = await models.Message.create({
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
        })

        const sender = await models.Contact.findOne({
          where: { id: senderId, tenant },
        })

        socket.sendJson(
          {
            type: 'payment',
            response: jsonUtils.messageToJson(message, chat, sender),
          },
          tenant
        )

        sendNotification(chat, sender.alias, 'message', owner)
      }
    })
    call.on('status', function (status) {
      console.log('Status', status.code, status)
      // The server is unavailable, trying to reconnect.
      if (
        status.code == ERR_CODE_UNAVAILABLE ||
        status.code == ERR_CODE_STREAM_REMOVED
      ) {
        i = 0
        waitAndReconnect()
      } else {
        resolve(status)
      }
    })
    call.on('error', function (err) {
      const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
      console.error('[LND] Error', now, err.code)
      if (
        err.code == ERR_CODE_UNAVAILABLE ||
        err.code == ERR_CODE_STREAM_REMOVED
      ) {
        i = 0
        waitAndReconnect()
      } else {
        reject(err)
      }
    })
    call.on('end', function () {
      const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
      console.log(`Closed stream ${now}`)
      // The server has closed the stream.
      i = 0
      waitAndReconnect()
    })
    setTimeout(() => {
      resolve(null)
    }, 100)
  })
}

function waitAndReconnect() {
  setTimeout(() => reconnectToLND(Math.random()), 2000)
}

var i = 0
var ctx = 0
export async function reconnectToLND(innerCtx: number, callback?: Function) {
  ctx = innerCtx
  i++
  const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
  console.log(`=> ${now} [lnd] reconnecting... attempt #${i}`)
  try {
    await network.initGrpcSubscriptions()
    const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
    console.log(`=> [lnd] connected! ${now}`)
    if (callback) callback()
  } catch (e) {
    if (e.code === ERR_CODE_UNIMPLEMENTED) {
      await tryToUnlockLND()
    }
    setTimeout(async () => {
      // retry each 2 secs
      if (ctx === innerCtx) {
        // if another retry fires, then this will not run
        await reconnectToLND(innerCtx, callback)
      }
    }, 2000)
  }
}
