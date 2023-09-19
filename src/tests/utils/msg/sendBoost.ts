import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { config } from '../../config'
import { getBalance, getCheckNewMsgs, getTribeIdFromUUID } from '../get'

export async function sendBoost(t, node1, node2, replyMessage, amount, tribe) {
  //NODE1 SENDS TEXT MESSAGE BOOST TO NODE2

  //get balances of both nodes before boost
  const [boosterBalBefore, boosteeBalBefore] = await boostBalances(
    t,
    node1,
    node2
  )

  //make sure that node2's message exists from node1 perspective
  const msgExists = await getCheckNewMsgs(t, node1, replyMessage.uuid)
  t.truthy(msgExists, 'message being replied to should exist')

  const msg = await boostAsMessage(t, tribe, node1, replyMessage, amount)

  //wait for boost message to process
  const msgUuid = msg.response.uuid
  t.truthy(msgUuid, 'msg uuid should exist')
  const lastMessage = await getCheckNewMsgs(t, node2, msgUuid)
  t.truthy(lastMessage, 'await message post')

  //get balances of both nodes before boost
  const [boosterBalAfter, boosteeBalAfter] = await boostBalances(
    t,
    node1,
    node2
  )

  // check that node1 sent payment and node2 received payment based on balances
  t.true(
    Math.abs(boosterBalBefore - boosterBalAfter - amount) <= config.allowedFee,
    'booster should have lost amount'
  )
  t.true(
    Math.abs(boosteeBalAfter - boosteeBalBefore - amount) <= config.allowedFee,
    'boostee should have gained amount'
  )

  return { success: true, message: msg.response }
}

async function boostBalances(t, booster, boostee) {
  const boosterBal = await getBalance(t, booster)
  t.true(typeof boosterBal === 'number')
  const boosteeBal = await getBalance(t, boostee)
  t.true(typeof boosteeBal === 'number')
  return [boosterBal, boosteeBal]
}

export async function boostAsMessage(t, tribe, node, replyMessage, amount) {
  //get uuid from node2's message
  const replyUuid = replyMessage.uuid
  t.truthy(replyUuid, 'replyUuid should exist')

  //get tribeId from node1 perspective
  const tribeId = await getTribeIdFromUUID(t, node, tribe)
  t.truthy(tribeId, 'tribeId should exist')

  //create boost message object for node2's message which is represented by replyUuid
  const v = {
    boost: true,
    contact_id: null,
    text: '',
    chat_id: tribeId,
    reply_uuid: replyUuid,
    amount: amount,
    message_price: 0,
  }
  //node1 sends a boost on node2's message
  try {
    const msg = await http.post(
      node.external_ip + '/messages',
      makeArgs(node, v)
    )
    t.true(msg.success, 'msg should exist')
    return msg
  } catch (error) {
    return error.error
  }
}
