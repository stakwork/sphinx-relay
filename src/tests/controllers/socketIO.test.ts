import test, { ExecutionContext } from 'ava'

import * as socketio from 'socket.io-client'
import nodes from '../nodes'
//import { tribe3Msgs } from './tribe3Messages.test'
import { sendPayment } from '../utils/msg'

import { addContact } from '../utils/save'

/*
  npx ava src/tests/controllers/chatInvoice.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

type WSMessage = { [k: string]: any }
type DataHandler = (data: any) => void
let handlers: { [k: string]: DataHandler } = {}
let io: any = null
var responseArray: any[] = []

test.serial(
  'test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact',
  async (t: ExecutionContext<Context>) => {
    connectWebSocket(
      'http://localhost:3001',
      nodes[0].authToken,
      () => {},
      () => {}
    )
    io.emit('connect')
    //    tribe3Msgs(t, nodes[0], nodes[1], nodes[2])
    await addContact(t, nodes[0], nodes[1])
    //NODE1 SENDS PAYMENT TO NODE2
    const amount = 101
    const paymentText = 'this eleven payment'
    const payment = await sendPayment(
      t,
      nodes[1],
      nodes[0],
      amount,
      paymentText
    )
    t.true(payment, 'payment should be sent')
    t.true(
      responseArray[responseArray.length - 1].response.contact.public_key ==
        nodes[1].pubkey,
      'payment should be sent'
    )
    t.true(
      responseArray[responseArray.length - 1].response.amount == amount,
      'payment should be sent'
    )
    t.true(
      responseArray[responseArray.length - 1].type == 'direct_payment',
      'payment should be sent'
    )
  }
)

export function connectWebSocket(
  ip: string,
  authToken: string,
  connectedCallback?: Function,
  disconnectCallback?: Function
) {
  if (io) {
    return // dont reconnect if already exists
  }

  io = socketio.connect(ip, {
    reconnection: true,
    extraHeaders: {
      'x-user-token': authToken,
    },
  })

  io.on('connect', (socket) => {
    console.log('=> socketio connected!')
    if (connectedCallback) connectedCallback()
  })

  io.on('disconnect', (socket) => {
    if (disconnectCallback) disconnectCallback()
  })

  io.on('message', (data) => {
    //console.log('recived message: ', JSON.parse(data))
    responseArray.push(JSON.parse(data))
    try {
      let msg: WSMessage = JSON.parse(data)
      let typ = msg.type
      if (typ === 'delete') typ = 'deleteMessage'
      let handler = handlers[typ]
      if (handler) {
        handler(msg)
      }
    } catch (e) {}
  })

  io.on('error', function (e) {
    console.log('socketio error', e)
  })
}
