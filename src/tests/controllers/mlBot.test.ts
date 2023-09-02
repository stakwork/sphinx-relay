import test from 'ava'
import { randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessage, decryptMessage, sendImage } from '../utils/msg'
import nodes from '../nodes'
import { getCheckBotMsg, shouldNotGetNewMsgs } from '../utils/get'
import { Message } from '../types'
import { greenSquare } from '../utils/base64images'

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
  const host = 'http://ml-bot-sphinx-server:3500'
  const url = `${host}/text`

  const model1 = 'gpt'

  //Add Model
  const addModel = `/ml add ${model1}`
  await sendTribeMessage(t, alice, tribe, addModel)

  await sleep(1000)

  //Alice Set Text URL
  const urlCommand = `/ml url ${model1} ${url}`
  await sendTribeMessage(t, alice, tribe, urlCommand)

  await sleep(20)

  const botReply2 = await getCheckBotMsg(t, alice, botAlias, tribe, 2)
  t.truthy(botReply2, 'MlBot should reply')

  //Alice set API_KEY
  const api_key = `/ml api_key ${model1} qwerty`
  const apiKeyMsg = await sendTribeMessage(t, alice, tribe, api_key)

  const botReply3 = await getCheckBotMsg(t, alice, botAlias, tribe, 3)
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
    '<div style="position:relative;max-width:fit-content;min-width:180px;"><div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:10rem;"><img src="https://res.cloudinary.com/teebams/image/upload/v1648478325/elite/wiot5aymifdzqwplyu1a.png" style="max-width:100%;object-fit:cover;"></div></div>'
  await sleep(5100)
  const botReply4 = (await getCheckBotMsg(
    t,
    bob,
    botAlias,
    tribe,
    2
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
  await sleep(5100)
  const botReply5 = (await getCheckBotMsg(
    t,
    bob,
    botAlias,
    tribe,
    2
  )) as Message
  const botResponse2 = decryptMessage(bob, botReply5)
  t.true(botResponse2 === botTextResponse)

  //Bob Node Should not See VirtualNode1 Message
  const checkNode4 = await shouldNotGetNewMsgs(t, bob, virtualNode1Message.uuid)
  t.true(checkNode4, 'BOB SHOULD NOT SEE VIRTUALNODE1 Message')

  //Alice change Tribe kind to image
  const imageKind = `/ml kind ${model1} image`
  await sendTribeMessage(t, alice, tribe, imageKind)

  const botReply6 = await getCheckBotMsg(t, alice, botAlias, tribe, 8)
  t.truthy(botReply6, 'MlBot should reply')

  const model2 = 'image_gpt'

  const imageUrl = `${host}/image`

  //Add new Model
  const newModel = `/ml add ${model2} ${imageUrl}`
  await sendTribeMessage(t, alice, tribe, newModel)

  await sleep(1000)

  //Alice update new model api_key
  const imageUrlMsg = `/ml api_key ${model2} twesting`
  await sendTribeMessage(t, alice, tribe, imageUrlMsg)

  const botReply7 = await getCheckBotMsg(t, alice, botAlias, tribe, 10)
  t.truthy(botReply7, 'MlBot should reply')

  await sleep(1000)

  //Alice change new model kind to image
  const imageUrlKind = `/ml kind ${model2} image`
  await sendTribeMessage(t, alice, tribe, imageUrlKind)

  await sleep(1000)

  //Alice sends Message in the tribe
  const text6 = randomText()
  const aliceMsg = await sendTribeMessage(
    t,
    alice,
    tribe,
    `@${model2} ${text6}`
  )

  await sleep(5100)

  const botReply8 = (await getCheckBotMsg(
    t,
    alice,
    botAlias,
    tribe,
    13
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
  const imageSent = await sendImage(
    t,
    virtualNode1,
    alice,
    greenSquare,
    tribe,
    0,
    '',
    `@${model2} ${text9}`
  )
  t.true(!!imageSent, 'message should have been sent')
  await sleep(5100)

  const botReply9 = (await getCheckBotMsg(
    t,
    virtualNode1,
    botAlias,
    tribe,
    4
  )) as Message
  const botResponse4 = decryptMessage(virtualNode1, botReply9)
  t.true(botResponse4 === botImageResponse)

  //Bob Node Should not See VirtualNode Message
  const checkNode7 = await shouldNotGetNewMsgs(t, bob, imageSent.uuid)
  t.true(checkNode7, 'BOB SHOULD NOT SEE VirtualNode Message')

  //VirtualNode sends reply bot response to get image URL
  const text10 = randomText()
  await sendTribeMessage(t, virtualNode1, tribe, `@${model2} ${text10}`, {
    reply_uuid: botReply9.uuid,
  })

  await sleep(5100)

  const botReply10 = (await getCheckBotMsg(
    t,
    virtualNode1,
    botAlias,
    tribe,
    6
  )) as Message
  const botResponse8 = decryptMessage(virtualNode1, botReply10)
  t.true(botResponse8 === botImageResponse)

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
