import test from 'ava'
import nodes from '../nodes'
import { createTribe, joinTribe } from '../utils/save'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createBot, sendBotMessage } from '../utils/bots'
import { getCheckBotMsg } from '../utils/get'

/*
npx ava src/tests/controllers/externalBotApi.test.ts --verbose --serial --timeout=2m
*/

test('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await externalBotApi(t)
})

export async function externalBotApi(t) {
  let node1 = nodes[0]
  let node2 = nodes[1]
  let node3 = nodes[2]
  let dave = nodes[3]
  let virtualNode = nodes[4]
  let virtualNode2 = nodes[5]

  console.log(
    `Checking external-api-bot in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias} and ${dave.alias} and ${virtualNode.alias} and ${virtualNode2.alias}`
  )

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //Dave JOINS TRIBE CREATED BY NODE1
  let join3 = await joinTribe(t, dave, tribe)
  t.true(join3, 'Dave should join tribe')

  //VirtualNode1 JOINS TRIBE CREATED BY NODE1
  let join4 = await joinTribe(t, virtualNode, tribe)
  t.true(join4, 'VirtualNode1 should join tribe')

  //VirtualNode2 JOINS TRIBE CREATED BY NODE1
  let join5 = await joinTribe(t, virtualNode2, tribe)
  t.true(join5, 'VirtualNode2 should join tribe')

  //Node1 Creates Bot via API
  const botAlias = 'test-bot'
  const bot = await createBot(t, node1, botAlias)
  t.true(bot.success, 'Bot should be created')

  //Node1 sends message with the bot
  await sendBotMessage(t, node1, bot.response, tribe)

  //Node1 Checks if he receives bot message
  const msg1 = await getCheckBotMsg(t, node1, botAlias, tribe, 1)
  t.truthy(msg1, `${botAlias} message should be found`)

  //Node2 Checks if he receives bot message
  const msg2 = await getCheckBotMsg(t, node2, botAlias, tribe, 1)
  t.truthy(msg2, `${botAlias} message should be found`)

  //Node3 Checks if he receives bot message
  const msg3 = await getCheckBotMsg(t, node3, botAlias, tribe, 1)
  t.truthy(msg3, `${botAlias} message should be found`)

  //Dave Checks if he receives bot message
  const msg4 = await getCheckBotMsg(t, dave, botAlias, tribe, 1)
  t.truthy(msg4, `${botAlias} message should be found`)

  //VirtualNode1 Checks if he receives bot message
  const msg5 = await getCheckBotMsg(t, virtualNode, botAlias, tribe, 1)
  t.truthy(msg5, `${botAlias} message should be found`)

  //VirtualNode2 Checks if he receives bot message
  const msg6 = await getCheckBotMsg(t, virtualNode2, botAlias, tribe, 1)
  t.truthy(msg6, `${botAlias} message should be found`)

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  //Dave LEAVES TRIBE
  let left4 = await leaveTribe(t, dave, tribe)
  t.true(left4, 'node3 should leave tribe')

  //VirtualNode1 LEAVES TRIBE
  let left5 = await leaveTribe(t, virtualNode, tribe)
  t.true(left5, 'node3 should leave tribe')

  //VirtualNode2 LEAVES TRIBE
  let left6 = await leaveTribe(t, virtualNode2, tribe)
  t.true(left6, 'node3 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
