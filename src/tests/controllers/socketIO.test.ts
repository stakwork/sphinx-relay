import test, { ExecutionContext } from 'ava'

import * as socketio from 'socket.io-client'
import * as socketiolegacy from 'socket.io-client-legacy'
import nodes from '../nodes'

import { randomText } from '../utils/helpers'

//import { tribe3Msgs } from './tribe3Messages.test'
import {
  sendPayment,
  sendMessageAndCheckDecryption,
  sendBoost,
  sendTribeMessage,
} from '../utils/msg'

import { addContact, joinTribe, createTribe } from '../utils/save'

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
    await testSocketIO(t, false)
    //await testSocketIO(t, true)
  }
)

async function testSocketIO(t: ExecutionContext<Context>, legacy: boolean) {
  connectWebSocket(
    'http://localhost:3002',
    nodes[1].authToken,
    legacy,
    () => {},
    () => {}
  )
  io.connect()
  //    tribe3Msgs(t, nodes[0], nodes[1], nodes[2])
  await addContact(t, nodes[0], nodes[1])
  console.log('\nafter add contact')
  responseArray.forEach((item) => console.log(item.type))

  //*******
  //Receive payment
  //payment.ts
  const amount = 101
  const paymentText = 'this eleven payment'
  await sendPayment(t, nodes[0], nodes[1], amount, paymentText)
  console.log('\nafter send payment')
  responseArray.forEach((item) => console.log(item.type))
  const payment = await sendPayment(t, nodes[0], nodes[1], amount, paymentText)
  console.log('\nafter second send payment')
  responseArray.forEach((item) => console.log(item.type))
  t.true(payment, 'payment should be sent')

  t.true(
    responseArray[responseArray.length - 1].response.contact.public_key ==
      nodes[0].pubkey,
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

  //*******
  //Recieve message
  //messages.ts
  //********
  const messageText = randomText()
  await sendMessageAndCheckDecryption(t, nodes[0], nodes[1], messageText)
  console.log('\nafter send direct message')
  responseArray.forEach((item) => console.log(item.type))
  t.true(
    responseArray[responseArray.length - 1].type == 'message',
    'we should get back something when we recieve a message'
  )
  //*****
  //recieve boost
  //messages.ts
  //*******

  const socketTribe = await createTribe(t, nodes[0])
  console.log('\nafter create tribe')
  responseArray.forEach((item) => console.log(item.type))

  await joinTribe(t, nodes[1], socketTribe)
  console.log('\nafter join tribe')
  responseArray.forEach((item) => console.log(item.type))

  const tribeMessage = await sendTribeMessage(
    t,
    nodes[1],
    socketTribe,
    messageText
  )
  console.log('\n after send tribe message')
  responseArray.forEach((item) => console.log(item.type))

  await sendBoost(t, nodes[0], nodes[1], tribeMessage, 10, socketTribe)
  console.log('\n after boost message')
  responseArray.forEach((item) => console.log(item.type))
  t.true(
    responseArray[responseArray.length - 4].type == 'confirmation',
    'we should get back something when we recieve a message'
  )
  t.true(
    responseArray[responseArray.length - 3].type == 'message',
    'we should get back something when we recieve a message'
  )
  t.true(
    responseArray[responseArray.length - 2].type == 'group_join',
    'we should get back something when we join a tribe group chat'
  )
  t.true(
    responseArray[responseArray.length - 1].type == 'boost',
    'we should get back something when we recieve a message'
  )
  //console.log('This is', responseArray)
  //******
  //Receive Invoice
  //invoices.ts
  //******
}

export function connectWebSocket(
  ip: string,
  authToken: string,
  legacy: boolean,
  connectedCallback?: Function,
  disconnectCallback?: Function
) {
  if (io) {
    return // dont reconnect if already exists
  }

  if (!legacy) {
    io = socketio.connect(ip, {
      reconnection: true,
      extraHeaders: {
        'x-user-token': authToken,
      },
    })
  } else {
    io = socketiolegacy.connect(ip, {
      reconnection: true,
      extraHeaders: {
        'x-user-token': authToken,
      },
    })
  }

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
