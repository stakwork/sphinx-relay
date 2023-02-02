import test from 'ava'
import nodes from '../nodes'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { getCheckBotMsg } from '../utils/get'
import { sendTribeMessage } from '../utils/msg'
import {
  createBadge,
  confirmBadge,
  // confirmBadgeCreatedThroughMessage,
  addTribeToBadge,
} from '../utils/bots'
import { randomText, sleep } from '../utils/helpers'
import {
  sendTribeMessageAndCheckDecryption,
  sendBoost,
  sendTribeDirectPayment,
} from '../utils/msg'

/*
npx ava src/tests/controllers/badgeBot.test.ts --verbose --serial --timeout=2m
*/

test('test badge bot: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await badgeBotTest(t, 0, 1, 2)
})

export async function badgeBotTest(t, index1, index2, index3) {
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  // NODE 2 CREATES A SECOND TRIBE
  let tribe2 = await createTribe(t, node1)
  t.truthy(tribe2, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe2.owner_route_hint = node1.routeHint
  let join3 = await joinTribe(t, node2, tribe2)
  t.true(join3, 'node2 should join tribe')

  //NODE1 SENDS A BOT HELP MESSAGE IN TRIBE
  const text = '/bot help'
  await sendTribeMessage(t, node1, tribe, text)

  //NODE1 AWAIT REPLY FROM BOT
  let botAlias = 'MotherBot'
  const botReply = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply, 'MotherBot should reply')

  //NODE1 SENDS A BOT INSTALL MESSAGE IN TRIBE
  const text2 = '/bot install badge'
  await sendTribeMessage(t, node1, tribe, text2)

  //NODE1 AWAIT REPLY FROM BOT
  botAlias = 'MotherBot'
  const botReply2 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply2, 'MotherBot should reply')

  //NODE1 SENDS A BOT INSTALL MESSAGE IN SECOND TRIBE
  const badge2 = '/bot install badge'
  await sendTribeMessage(t, node1, tribe2, badge2)

  //NODE1 AWAIT REPLY FROM BOT
  botAlias = 'MotherBot'
  const botReply3 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply3, 'MotherBot should reply')

  // // NODE1 CREATES A BADGE THROUGH THE ENPOINT
  const earnBadge = await createBadge(t, node1, 'Earn Badge')
  t.truthy(earnBadge, 'Badge should be created by Node1')

  // Adding Badge to Tribe
  const addTribe = await addTribeToBadge(t, node1, tribe, 1, 10)
  t.truthy(addTribe, 'Badge should be created by Node1')

  // NODE1 ADD A BADGE DDIRECTLY FROM MESSAGE
  const createSpendBadge = '/badge add 22222222222222222222222222 2 10'
  await sendTribeMessage(t, node1, tribe2, createSpendBadge)
  // const spendBadge = await createBadge(t, node1, tribe, 2, 20, 'Spend')
  // t.truthy(spendBadge, 'Badge should be created by Node1')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe2.owner_route_hint = node1.routeHint
  let join4 = await joinTribe(t, node3, tribe2)
  t.true(join4, 'node3 should join tribe')

  // await sleep(1000)

  //NODE2 SENDS A MESSAGE IN THE TRIBE AND NODE3 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text3 = randomText()
  let tribeMessage1 = await sendTribeMessageAndCheckDecryption(
    t,
    node2,
    node3,
    text3,
    tribe
  )
  t.truthy(tribeMessage1, 'node2 should send message to tribe')

  //NODE2 SENDS A MESSAGE IN THE TRIBE AND NODE3 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text4 = randomText()
  let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
    t,
    node2,
    node3,
    text4,
    tribe2
  )
  t.truthy(tribeMessage2, 'node2 should send message to tribe')

  //NODE3 SENDS A BOOST ON NODE2'S MESSAGE
  const boost3 = await sendBoost(t, node3, node2, tribeMessage1, 15, tribe)
  t.true(boost3.success)

  const payment = await sendTribeDirectPayment(
    t,
    node3,
    node2,
    tribeMessage1,
    15,
    tribe
  )
  t.true(payment.success, 'Direct Payment in tribe should be successful')

  const payment2 = await sendTribeDirectPayment(
    t,
    node3,
    node2,
    tribeMessage2,
    15,
    tribe2
  )
  t.true(payment2.success, 'Direct Payment in tribe should be successful')

  await sleep(10000)

  // CHECK IF NODE2 ACTUALLY RECIEVED THE BAGDE ON THE ELEMENT SERVER
  const confirm = await confirmBadge(node2, 22222222222222222222222222)
  t.true(confirm, 'Node 2 should recieve the earner badge')

  // await sleep(1000)

  // CHECK IF NODE3 ACTUALLY RECIEVED THE BAGDE ON THE ELEMENT SERVER
  // const confirm1 = await confirmBadgeCreatedThroughMessage(
  //   node1,
  //   node3,
  //   tribe.id,
  //   2
  // )
  // t.true(confirm1, 'Node 3 should recieve the spender badge')

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE2 LEAVES TRIBE 2
  let left4 = await leaveTribe(t, node2, tribe2)
  t.true(left4, 'node2 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left5 = await leaveTribe(t, node3, tribe2)
  t.true(left5, 'node3 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')

  //NODE1 DELETES TRIBE 2
  let delTribe3 = await deleteTribe(t, node1, tribe2)
  t.true(delTribe3, 'node1 should delete tribe')
}
