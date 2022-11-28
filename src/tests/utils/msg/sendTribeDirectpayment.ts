import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { config } from '../../config'
import { getBalance, getCheckNewMsgs, getTribeIdFromUUID } from '../get'

export async function sendTribeDirectPayment(
  t,
  node1,
  node2,
  replyMessage,
  amount,
  tribe
) {
  //NODE1 SENDS TEXT MESSAGE BOOST TO NODE2

  //get balances of both nodes before payment
  const [payerBalBefore, payeeBalBefore] = await boostBalances(t, node1, node2)

  //make sure that node2's message exists from node1 perspective
  const msgExists = await getCheckNewMsgs(t, node1, replyMessage.uuid)
  t.truthy(msgExists, 'message being replied to should exist')

  //get uuid from node2's message
  const replyUuid = replyMessage.uuid
  t.truthy(replyUuid, 'replyUuid should exist')

  //get tribeId from node1 perspective
  const tribeId = await getTribeIdFromUUID(t, node1, tribe)
  t.truthy(tribeId, 'tribeId should exist')

  //create boost message object for node2's message which is represented by replyUuid
  const v = {
    pay: true,
    contact_id: null,
    text: '',
    chat_id: tribeId,
    reply_uuid: replyUuid,
    amount: amount,
    message_price: 0,
  }

  //node1 sends a boost on node2's message
  const msg = await http.post(
    node1.external_ip + '/messages',
    makeArgs(node1, v)
  )
  t.true(msg.success, 'msg should exist')

  //wait for boost message to process
  const msgUuid = msg.response.uuid
  t.truthy(msgUuid, 'msg uuid should exist')
  const lastMessage = await getCheckNewMsgs(t, node2, msgUuid)
  t.truthy(lastMessage, 'await message post')

  //get balances of both nodes before boost
  const [payerBalAfter, payeeBalAfter] = await boostBalances(t, node1, node2)

  // check that node1 sent payment and node2 received payment based on balances
  t.true(
    Math.abs(payerBalBefore - payerBalAfter - amount) <= config.allowedFee,
    'booster should have lost amount'
  )
  t.true(
    Math.abs(payeeBalAfter - payeeBalBefore - amount) <= config.allowedFee,
    'boostee should have gained amount'
  )

  return { success: true, message: msg.response }
}

async function boostBalances(t, payer, payee) {
  const payerBal = await getBalance(t, payer)
  t.true(typeof payerBal === 'number')
  const payeeBal = await getBalance(t, payee)
  t.true(typeof payeeBal === 'number')
  return [payerBal, payeeBal]
}
