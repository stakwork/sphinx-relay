import test from 'ava'
import { randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessage, decryptMessage } from '../utils/msg'
import nodes from '../nodes'
import { getCheckBotMsg, shouldNotGetNewMsgs } from '../utils/get'
import { Message } from '../types'

/*
npx ava src/tests/controllers/mlBot.test.ts --verbose --serial --timeout=2m
*/

test('test ml-bot: create tribe, join tribe, install bot, send messages, receive bot response, leave tribe, delete tribe', async (t) => {
  await mlBot(t, 0, 1, 4)
})

export async function mlBot(t, index1, index2, index3) {
  let alice = nodes[index1]
  let bob = nodes[index2]
  let virtualNode1 = nodes[index3]
  t.truthy(virtualNode1, 'this test requires three nodes')

  console.log(
    `Checking ml-bot response in tribe for ${alice.alias} and ${bob.alias} and ${virtualNode1.alias}`
  )

  //ALICE CREATES A TRIBE
  let tribe = await createTribe(t, alice)
  t.truthy(tribe, 'tribe should have been created by alice')

  //BOB JOINS TRIBE CREATED BY NODE1
  if (alice.routeHint) tribe.owner_route_hint = alice.routeHint
  let join = await joinTribe(t, bob, tribe)
  t.true(join, 'bob should join tribe')

  //VIRTUALNODE1 JOINS TRIBE CREATED BY NODE1
  let join2 = await joinTribe(t, virtualNode1, tribe)
  t.true(join2, 'node3 should join tribe')

  //Alice installs ML Bot
  const install = '/bot install ml'
  await sendTribeMessage(t, alice, tribe, install)

  let botAlias = 'MotherBot'
  const botReply = await getCheckBotMsg(t, alice, botAlias, tribe, 1)
  t.truthy(botReply, 'MotherBot should reply')

  botAlias = 'MlBot'

  //http://ml-bot-sphinx-server:3500/text
  const url = 'http://ml-bot-sphinx-server:3500/text'

  //Alice Set Text URL
  const urlCommand = `/ml url ${url}`
  await sendTribeMessage(t, alice, tribe, urlCommand)

  await sleep(20)

  const botReply2 = await getCheckBotMsg(t, alice, botAlias, tribe, 1)
  t.truthy(botReply2, 'MlBot should reply')

  //Alice set API_KEY
  const api_key = '/ml api_key qwerty'
  const apiKeyMsg = await sendTribeMessage(t, alice, tribe, api_key)

  const botReply3 = await getCheckBotMsg(t, alice, botAlias, tribe, 2)
  t.truthy(botReply3, 'MlBot should reply')

  const checkNode1 = await shouldNotGetNewMsgs(t, bob, apiKeyMsg.uuid)
  t.true(checkNode1, 'BOB SHOULD NOT SEE THE API_KEY TRIBE COMMAND')

  const checkNode2 = await shouldNotGetNewMsgs(t, virtualNode1, apiKeyMsg.uuid)
  t.true(checkNode2, 'VIRTUALNODE1 SHOULD NOT SEE THE API_KEY TRIBE COMMAND')

  //Bot sends Message in tribe
  const text4 = randomText()
  const bobMessage = await sendTribeMessage(t, bob, tribe, text4)

  const botTextResponse =
    '<div style="position:relative;max-width:fit-content;min-width:180px;"><div style="font-size:15px;margin:5px 0;max-width:90%;">This is a response from test ml-bot server built in sphinx-stack</div></div>'
  const botImageResponse =
    '<div style="position:relative;max-width:fit-content;min-width:180px;"><div style="display:flex;align-items:center;justify-content:center;width:100%;"><img src="https://res.cloudinary.com/teebams/image/upload/v1648478325/elite/wiot5aymifdzqwplyu1a.png" style="max-width:100%;object-fit:cover;"></div></div>'
  await sleep(8000)
  const botReply4 = (await getCheckBotMsg(
    t,
    bob,
    botAlias,
    tribe,
    1
  )) as Message
  const botResponse = decryptMessage(bob, botReply4)
  t.true(botResponse === botTextResponse)

  //VirtualNodeShould Node See Message
  const checkNode3 = await shouldNotGetNewMsgs(t, virtualNode1, bobMessage.uuid)
  t.true(checkNode3, 'VIRTUALNODE1 SHOULD NOT SEE Bob Message')

  //Bot sends Message in tribe
  const text5 = randomText()
  const virtualNode1Message = await sendTribeMessage(
    t,
    virtualNode1,
    tribe,
    text5
  )
  await sleep(8000)
  const botReply5 = (await getCheckBotMsg(
    t,
    bob,
    botAlias,
    tribe,
    1
  )) as Message
  const botResponse2 = decryptMessage(bob, botReply5)
  t.true(botResponse2 === botTextResponse)

  //Bob Node Should not See VirtualNode1 Message
  const checkNode4 = await shouldNotGetNewMsgs(t, bob, virtualNode1Message.uuid)
  t.true(checkNode4, 'BOB SHOULD NOT SEE VIRTUALNODE1 Message')

  //Alice change Tribe kind to image
  const imageKind = '/ml kind image'
  await sendTribeMessage(t, alice, tribe, imageKind)

  const botReply6 = await getCheckBotMsg(t, alice, botAlias, tribe, 5)
  t.truthy(botReply6, 'MlBot should reply')

  const imageUrl = 'http://ml-bot-sphinx-server:3500/image'

  //Alice change Tribe kind to image
  const imageUrlMsg = `/ml url ${imageUrl}`
  await sendTribeMessage(t, alice, tribe, imageUrlMsg)

  const botReply7 = await getCheckBotMsg(t, alice, botAlias, tribe, 6)
  t.truthy(botReply7, 'MlBot should reply')

  //Alice sends Message in the tribe
  const text6 = randomText()
  const aliceMsg = await sendTribeMessage(t, alice, tribe, text6)

  await sleep(8000)

  const botReply8 = (await getCheckBotMsg(
    t,
    alice,
    botAlias,
    tribe,
    7
  )) as Message
  const botResponse3 = decryptMessage(alice, botReply8)
  t.true(botResponse3 === botImageResponse)

  //Bob Node Should not See Alice Message
  const checkNode5 = await shouldNotGetNewMsgs(t, bob, aliceMsg.uuid)
  t.true(checkNode5, 'BOB SHOULD NOT SEE ALICE Message')

  //VirtualNode1 Should not See Alice Message
  const checkNode6 = await shouldNotGetNewMsgs(t, virtualNode1, aliceMsg.uuid)
  t.true(checkNode6, 'VIRTUALNODE1 SHOULD NOT SEE ALICE Message')

  //VirtualNode1 send message in tribe
  const text9 = randomText()
  const virtualNodeImageMsg = await sendTribeMessage(
    t,
    virtualNode1,
    tribe,
    text9
  )
  await sleep(8000)

  const botReply9 = (await getCheckBotMsg(
    t,
    virtualNode1,
    botAlias,
    tribe,
    2
  )) as Message
  const botResponse4 = decryptMessage(virtualNode1, botReply9)
  t.true(botResponse4 === botImageResponse)

  //Bob Node Should not See VirtualNode Message
  const checkNode7 = await shouldNotGetNewMsgs(t, bob, virtualNodeImageMsg.uuid)
  t.true(checkNode7, 'BOB SHOULD NOT SEE VirtualNode Message')

  //BOB LEAVES TRIBE
  let left2 = await leaveTribe(t, bob, tribe)
  t.true(left2, 'bob should leave tribe')

  //VIRTUALNODE1 LEAVES TRIBE
  let left3 = await leaveTribe(t, virtualNode1, tribe)
  t.true(left3, 'virtualNode1 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, alice, tribe)
  t.true(delTribe2, 'alice should delete tribe')
}
