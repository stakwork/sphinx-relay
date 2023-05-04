import test from 'ava'
import { randomText } from '../utils/helpers'
import { deleteTribe, leaveTribe, disappearingMessages } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import {
  sendTribeMessageAndCheckDecryption,
  sendBoost,
  getTribeMessages,
} from '../utils/msg'
import nodes from '../nodes'

/*
npx ava src/tests/controllers/deleteMessages.test.ts --verbose --serial --timeout=2m
*/

test('test message deleter: create tribe, join tribe, send messages, boost messages, delete messages, check number of messages, leave tribe, delete tribe', async (t) => {
  await messageDeleter(t, 0, 1, 2)
})

export async function messageDeleter(t, index1, index2, index3) {
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

  const text4 = randomText()
  let tribeMessage4 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text4,
    tribe
  )
  t.truthy(tribeMessage4, 'node3 should send message to tribe')

  const text5 = randomText()
  let tribeMessage5 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text5,
    tribe
  )
  t.truthy(tribeMessage5, 'node3 should send message to tribe')

  const text6 = randomText()
  let tribeMessage6 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text6,
    tribe
  )
  t.truthy(tribeMessage6, 'node3 should send message to tribe')

  const text7 = randomText()
  let tribeMessage7 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text7,
    tribe
  )
  t.truthy(tribeMessage7, 'node3 should send message to tribe')

  const text8 = randomText()
  let tribeMessage8 = await sendTribeMessageAndCheckDecryption(
    t,
    node3,
    node1,
    text8,
    tribe
  )
  t.truthy(tribeMessage8, 'node3 should send message to tribe')

  //NODE1 SENDS A BOOST ON NODE2'S MESSAGE
  const boost = await sendBoost(t, node1, node2, tribeMessage2, 11, tribe)
  t.true(boost.success)

  //NODE2 SENDS A BOOST ON NODE3'S MESSAGE
  const boost2 = await sendBoost(t, node2, node3, tribeMessage3, 12, tribe)
  t.true(boost2.success)

  //NODE3 SENDS A BOOST ON NODE1'S MESSAGE
  const boost3 = await sendBoost(t, node3, node1, tribeMessage1, 13, tribe)
  t.true(boost3.success)

  const boost4 = await sendBoost(t, node1, node3, tribeMessage4, 13, tribe)
  t.true(boost4.success)

  const boost5 = await sendBoost(t, node1, node3, tribeMessage5, 13, tribe)
  t.true(boost5.success)

  const deleteMessage = await disappearingMessages(t, node1)
  t.true(deleteMessage, 'Messages should be deleted')

  const tribeMessages = await getTribeMessages(t, node1, tribe)
  t.true(
    tribeMessages.length === 10,
    'The total number of message left should be 10'
  )

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
