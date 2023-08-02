import test from 'ava'
import nodes from '../nodes'
import { createTribe, joinTribe } from '../utils/save'
import { deleteTribe, leaveTribe } from '../utils/del'
import { sendTribeMessage } from '../utils/msg'
import {
  getCheckBotMsg,
  getCheckNewMsgs,
  shouldNotGetNewMsgs,
} from '../utils/get'
import { randomText, sleep } from '../utils/helpers'

/*
npx ava src/tests/controllers/spamGoneBot.test.ts --verbose --serial --timeout=2m
*/

test('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await spamGoneBot(t)
})

export async function spamGoneBot(t) {
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
  const text = '/bot install spam_gone'
  await sendTribeMessage(t, bob, tribe, text)

  await sleep(1000)

  //BOB AWAIT REPLY FROM BOT
  let botAlias = 'MotherBot'
  const botReply = await getCheckBotMsg(t, bob, botAlias, tribe, 1)
  t.truthy(botReply, 'Mother Bot should reply')

  await sleep(1000)

  //Bob adds alice to spam list
  const text2 = `/spam_gone add ${alice.pubkey}`
  const msg = await sendTribeMessage(t, bob, tribe, text2)

  //BOB AWAIT REPLY FROM BOT
  botAlias = 'SpamGoneBot'
  const botReply2 = await getCheckBotMsg(t, bob, botAlias, tribe, 1)
  t.truthy(botReply2, 'Example Bot should reply')

  //ALICE SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
  const checkAlice = await shouldNotGetNewMsgs(t, alice, msg.uuid)
  t.true(checkAlice, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND')

  //Alice sends message in tribe
  const text3 = randomText()
  const msg2 = await sendTribeMessage(t, alice, tribe, text3)

  //Carol checks content of the message, but will later change to test if the message type is spam
  const checkMsg = await getCheckNewMsgs(t, carol, msg2.uuid)
  t.true(checkMsg.message_content === '', 'Message content should be empty')

  //VirtualNode1 checks content of the message, but will later change to test if the message type is spam
  const checkMsg2 = await getCheckNewMsgs(t, virtualNode, msg2.uuid)
  t.true(checkMsg2.message_content === '', 'Message content should be empty')

  //VirtualNode2 sends message in tribe
  const text6 = randomText()
  const msg5 = await sendTribeMessage(t, virtualNode2, tribe, text6)

  //Carol Checks if they received the message
  const checkMsg6 = await getCheckNewMsgs(t, carol, msg5.uuid)
  t.true(
    checkMsg6.message_content !== '',
    'Message content should not be empty'
  )

  //Alice Checks if they received message
  const checkMsg7 = await getCheckNewMsgs(t, alice, msg5.uuid)
  t.true(
    checkMsg7.message_content !== '',
    'Message content should not be empty'
  )

  //VirtualNode1 checks if they received message
  const checkMsg8 = await getCheckNewMsgs(t, virtualNode, msg5.uuid)
  t.true(
    checkMsg8.message_content !== '',
    'Message content should not be empty'
  )

  //Bob removes Alice from spam list
  const text4 = `/spam_gone remove ${alice.pubkey}`
  const msg3 = await sendTribeMessage(t, bob, tribe, text4)

  await sleep(1000)

  //VIRTUALNODE2 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
  const checkVirtualNode2 = await shouldNotGetNewMsgs(
    t,
    virtualNode2,
    msg3.uuid
  )
  t.true(checkVirtualNode2, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND')

  //Alice sends message in tribe
  const text5 = randomText()
  const msg4 = await sendTribeMessage(t, alice, tribe, text5)

  //Bob should see the meesage content, will change this to type later
  const checkMsg3 = await getCheckNewMsgs(t, bob, msg4.uuid)
  t.true(
    checkMsg3.message_content !== '',
    'Message content should be available'
  )

  //VirtualNode1 should see the meesage content, will change this to type later
  const checkMsg4 = await getCheckNewMsgs(t, virtualNode2, msg4.uuid)
  t.true(
    checkMsg4.message_content !== '',
    'Message content should be available'
  )

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
