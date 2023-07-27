import test from 'ava'
import nodes from '../nodes'
import { createTribe, joinTribe } from '../utils/save'
import { deleteTribe, leaveTribe } from '../utils/del'
import { sendTribeMessage } from '../utils/msg'
import { getCheckBotMsg } from '../utils/get'
import { sleep } from '../utils/helpers'

/*
npx ava src/tests/controllers/externalHostedBot.test.ts --verbose --serial --timeout=2m
*/

test('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await externalHostedBot(t)
})

export async function externalHostedBot(t) {
  let alice = nodes[0]
  let bob = nodes[1]
  let carol = nodes[2]
  let dave = nodes[3]
  let virtualNode = nodes[4]
  let virtualNode2 = nodes[5]

  console.log(
    `Checking external hosted bot in tribe for ${alice.alias} and ${bob.alias} and ${carol.alias} and ${dave.alias} and ${virtualNode.alias} and ${virtualNode2.alias}`
  )

  //BOB CREATES A TRIBE
  let tribe = await createTribe(t, bob)
  t.truthy(tribe, 'tribe should have been created by bob')

  //ALICE JOINS TRIBE CREATED BY NODE1
  if (bob.routeHint) tribe.owner_route_hint = bob.routeHint
  let join = await joinTribe(t, alice, tribe)
  t.true(join, 'node2 should join tribe')

  //CAROL JOINS TRIBE CREATED BY NODE1
  let join2 = await joinTribe(t, carol, tribe)
  t.true(join2, 'node3 should join tribe')

  //DAVE JOINS TRIBE CREATED BY NODE1
  let join3 = await joinTribe(t, dave, tribe)
  t.true(join3, 'Dave should join tribe')

  //VirtualNode1 JOINS TRIBE CREATED BY NODE1
  let join4 = await joinTribe(t, virtualNode, tribe)
  t.true(join4, 'VirtualNode1 should join tribe')

  //VirtualNode2 JOINS TRIBE CREATED BY NODE1
  let join5 = await joinTribe(t, virtualNode2, tribe)
  t.true(join5, 'VirtualNode2 should join tribe')

  //BOB installs Example Bot
  const text = '/bot install example'
  await sendTribeMessage(t, bob, tribe, text)

  await sleep(1000)

  //BOB AWAIT REPLY FROM BOT
  let botAlias = 'example'
  const botReply = await getCheckBotMsg(t, bob, botAlias, tribe, 1)
  t.truthy(botReply, 'Example Bot should reply')

  await sleep(1000)

  //ALICE sends message to bot
  const text2 = '/example test'
  await sendTribeMessage(t, alice, tribe, text2)

  await sleep(1000)

  //Alice Await reply from Bot
  const botReply2 = await getCheckBotMsg(t, alice, botAlias, tribe, 2)
  t.truthy(botReply2, 'Example Bot should reply')

  //VirtualNode2 checks if he received example bot response
  const botReply3 = await getCheckBotMsg(t, virtualNode2, botAlias, tribe, 2)
  t.truthy(botReply3, 'Example Bot should reply')

  //Dave checks if he received example bot response
  const botReply7 = await getCheckBotMsg(t, dave, botAlias, tribe, 2)
  t.truthy(botReply7, 'Example Bot should reply')

  //Bot installs Bet Bot
  const text3 = '/bot install bet'
  await sendTribeMessage(t, bob, tribe, text3)

  await sleep(1000)

  //Bot Awaits response from bot
  botAlias = 'bet'
  const botReply4 = await getCheckBotMsg(t, bob, botAlias, tribe, 1)
  t.truthy(botReply4, 'Bet Bot should reply')

  //Virtualnode uses the bet bot
  const text4 = '/bet new price'
  await sendTribeMessage(t, virtualNode, tribe, text4)

  await sleep(1000)

  //VirtualNode wait for response from Bet bot
  const botReply5 = await getCheckBotMsg(t, virtualNode, botAlias, tribe, 2)
  t.truthy(botReply5, 'Bet Bot should reply')

  //Carol checks if she got bot response
  const botReply6 = await getCheckBotMsg(t, carol, botAlias, tribe, 2)
  t.truthy(botReply6, 'Bet Bot should reply')

  //Dave checks if he received response from bet bot
  const botReply8 = await getCheckBotMsg(t, dave, botAlias, tribe, 2)
  t.truthy(botReply8, 'Bet Bot should reply')

  //ALICE LEAVES TRIBE
  let left2 = await leaveTribe(t, alice, tribe)
  t.true(left2, 'node2 should leave tribe')

  //CAROL LEAVES TRIBE
  let left3 = await leaveTribe(t, carol, tribe)
  t.true(left3, 'node3 should leave tribe')

  //DAVE LEAVES TRIBE
  let left4 = await leaveTribe(t, dave, tribe)
  t.true(left4, 'node3 should leave tribe')

  //VirtualNode1 LEAVES TRIBE
  let left5 = await leaveTribe(t, virtualNode, tribe)
  t.true(left5, 'node3 should leave tribe')

  //VirtualNode2 LEAVES TRIBE
  let left6 = await leaveTribe(t, virtualNode2, tribe)
  t.true(left6, 'node3 should leave tribe')

  //BOB DELETES TRIBE
  let delTribe2 = await deleteTribe(t, bob, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
