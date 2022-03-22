import test, { ExecutionContext } from 'ava'

import * as socketio from 'socket.io-client'
import * as socketiolegacy from 'socket.io-client-legacy'
import nodes from '../nodes'

import { randomText, sleep } from '../utils/helpers'

//import { tribe3Msgs } from './tribe3Messages.test'
import {
  sendPayment,
  sendMessageAndCheckDecryption,
  sendBoost,
  sendTribeMessage,
  sendInvoice,
} from '../utils/msg'

import { addContact, joinTribe, createTribe } from '../utils/save'
import { deleteMessage } from '../utils/del'

/*
  npx ava src/tests/controllers/socketIO.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

type WSMessage = { [k: string]: any }
type DataHandler = (data: any) => void
let handlers: { [k: string]: DataHandler } = {}
let io: any = null
var responseArray: any[] = []

test.serial('test-09-socketIO', async (t: ExecutionContext<Context>) => {
  await testSocketIO(t, false)
  //await testSocketIO(t, true)
})

async function testSocketIO(t: ExecutionContext<Context>, legacy: boolean) {
  connectWebSocket(
    'http://localhost:3002',
    nodes[1].authToken,
    legacy,
    () => {},
    () => {}
  )
  io.connect()
  await addContact(t, nodes[0], nodes[1])

  //*******
  //Receive payment
  //payment.ts
  const amount = 101
  const paymentText = 'this eleven payment'

  await sendPayment(t, nodes[0], nodes[1], amount, paymentText)
  const payment = await sendPayment(t, nodes[0], nodes[1], amount, paymentText)

  t.true(payment, 'payment should be sent')

  t.true(
    responseArray[responseArray.length - 1].response.contact.public_key ==
      nodes[0].pubkey,
    'payment should be sent'
  )
  t.true(
    responseArray[responseArray.length - 1].response.amount == amount,
    'payment should be sent with correct amount'
  )
  t.true(
    responseArray[responseArray.length - 1].type == 'direct_payment',
    'payment should have the correct type'
  )

  //*******
  //Recieve message
  //messages.ts
  //********
  const messageText = randomText()
  const sentMessage = await sendMessageAndCheckDecryption(
    t,
    nodes[0],
    nodes[1],
    messageText
  )
  t.true(
    responseArray[responseArray.length - 1].type == 'message',
    'we should get back something when we recieve a message'
  )
  //*****
  //recieve boost
  //messages.ts
  //*******

  const socketTribe = await createTribe(t, nodes[0])

  await joinTribe(t, nodes[1], socketTribe)

  const tribeMessage = await sendTribeMessage(
    t,
    nodes[1],
    socketTribe,
    messageText
  )

  await sendBoost(t, nodes[0], nodes[1], tribeMessage, 10, socketTribe)

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

  await deleteMessage(t, nodes[0], sentMessage.id)
  await sleep(1000)
  t.true(
    responseArray[responseArray.length - 1].type == 'delete',
    'we should get back a delete type'
  )

  /*******
   * Recieve Invoice
   */
  await sendInvoice(t, nodes[0], nodes[1], 11, 'Invoice sample text')
  await sleep(1000)
  t.true(
    responseArray[responseArray.length - 1].type == 'invoice',
    'we should get back a invoice type'
  )
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
