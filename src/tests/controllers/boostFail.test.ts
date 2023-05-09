import test from 'ava'
import { randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import {
  sendTribeMessageAndCheckDecryption,
  boostAsMessage,
  sendDirectPayment,
} from '../utils/msg'
import nodes from '../nodes'
import { shouldNotGetNewMsgs, getMsgByUuid } from '../utils/get'

/*
npx ava src/tests/controllers/boostFail.test.ts --verbose --serial --timeout=2m
*/

test('test boostFail: create tribe, join tribe, send messages, boost messages,send direct payment, ensure if admin cant boost other tribe members should not get the message, leave tribe, delete tribe', async (t) => {
  await boostFail(t, 0, 1, 2)
})

export async function boostFail(t, index1, index2, index3) {
  //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]
  t.truthy(node3, 'this test requires three nodes')

  console.log(
    `Checking boost messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`
  )

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE1 SENDS A MESSAGE IN THE TRIBE AND NODE2 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text = randomText()
  let tribeMessage1 = await sendTribeMessageAndCheckDecryption(
    t,
    node1,
    node2,
    text,
    tribe
  )
  t.truthy(tribeMessage1, 'node1 should send message to tribe')

  //NODE2 SENDS A MESSAGE IN THE TRIBE AND NODE3 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
    t,
    node2,
    node3,
    text2,
    tribe
  )
  t.truthy(tribeMessage2, 'node2 should send message to tribe')

  //NODE3 SENDS A MESSAGE IN THE TRIBE AND NODE1 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text3 = randomText()
  let tribeMessage3 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text3,
    tribe
  )
  t.truthy(tribeMessage3, 'node3 should send message to tribe')

  //NODE1 SENDS A BOOST ON NODE2'S MESSAGE
  //   const boost = await sendBoost(t, node1, node2, tribeMessage2, 11, tribe)
  const boost = await boostAsMessage(
    t,
    tribe,
    node1,
    tribeMessage2,
    1100000000000
  )
  t.true(boost.success)

  //Node 2 should not get the boost message, because the boost should fail
  const checkNode2 = await shouldNotGetNewMsgs(t, node2, boost.response.uuid)
  t.true(checkNode2, 'Node2 should not receive the boost message')

  //Node 3 should not get the boost message, because the bosst should fail
  const checkNode3 = await shouldNotGetNewMsgs(t, node3, boost.response.uuid)
  t.true(checkNode3, 'Node3 should not receive the boost message')

  //Node3 tries to boost Node2
  const node3Boost = await boostAsMessage(
    t,
    tribe,
    node3,
    tribeMessage2,
    520000
  )
  await sleep(1000)
  const node3boostedMsg = await getMsgByUuid(t, node3, node3Boost.response)
  t.truthy(node3boostedMsg, 'Message should exist')
  if (node3boostedMsg)
    t.truthy(node3boostedMsg.error_message, 'there should be an error message')

  //Node 2 should not get the boost message sent by node3, because the boost should fail
  const checkNode6 = await shouldNotGetNewMsgs(
    t,
    node2,
    node3Boost.response.uuid
  )
  t.true(checkNode6, 'Node3 should not receive the boost message sent by node2')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  await sleep(1000)

  //send boost to a user who has left the tribe
  const boost2 = await boostAsMessage(t, tribe, node2, tribeMessage3, 11)

  await sleep(1000)

  const boostedMsg = await getMsgByUuid(t, node2, boost2.response)
  t.truthy(boostedMsg, 'Message should exist')
  if (boostedMsg)
    t.truthy(boostedMsg.error_message, 'there should be an error message')

  //Node 3 should not get the boost message sent by node2, because the boost should fail
  const checkNode4 = await shouldNotGetNewMsgs(t, node3, boost2.response.uuid)
  t.true(checkNode4, 'Node3 should not receive the boost message sent by node2')

  //Send direct payment to a user who has left the tribe
  const sendDirectPayment1 = await sendDirectPayment({
    t,
    node: node2,
    tribe,
    amount: 100,
    replyMessage: tribeMessage3,
  })

  await sleep(1000)

  const paymentSent = await getMsgByUuid(t, node2, sendDirectPayment1.response)
  t.truthy(paymentSent, 'Message should exist')
  if (paymentSent)
    t.truthy(paymentSent.error_message, 'there should be an error message')

  //Node 3 should not get the boost message sent by node2, because the boost should fail
  const checkNode5 = await shouldNotGetNewMsgs(
    t,
    node3,
    sendDirectPayment1.response.uuid
  )
  t.true(checkNode5, 'Node3 should not receive the boost message sent by node2')

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
