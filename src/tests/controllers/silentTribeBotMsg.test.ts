import test from 'ava'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessage } from '../utils/msg'
import nodes from '../nodes'
import { deleteTribe, leaveTribe } from '../utils/del'
import {
  getCheckBotMsg,
  getCheckNewMsgs,
  shouldNotGetNewMsgs,
  shouldNotGetBotRes,
} from '../utils/get'
import { sleep } from '../utils/helpers'

/*
npx ava src/tests/controllers/silentTribeBotMsg.test.ts --verbose --serial --timeout=2m
*/

test('test-30-slinetTribeBotMsg: create tribe, install to tribe bot, send hidden tribe commands, delete bot, delete tribe', async (t) => {
  await silentTribeBotMsg(t, nodes[4], nodes[1], nodes[2])
})

async function silentTribeBotMsg(t, node1, node2, node3) {
  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

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

  //NODE1 INSTALLS CALLRECORDING BOT
  const text2 = '/bot install callRecording'
  await sendTribeMessage(t, node1, tribe, text2)

  //NODE1 INSTALLS WELCOME BOT
  const text = '/bot install welcome'
  await sendTribeMessage(t, node1, tribe, text)

  await sleep(2000)
  //NODE1 USES THE UPDATE COMMAND FOR CALLRECORDING BOT
  const text3 =
    '/callRecording update 1 jitsi_server s3_bucket_url stakwork_api_key webhook_url'
  const updateCall = await sendTribeMessage(t, node1, tribe, text3)

  //NODE1 SHOULD SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
  const checkNode1 = await getCheckNewMsgs(t, node1, updateCall.uuid)
  t.truthy(checkNode1, 'NODE 1 SHOULD SEE THE UPDATE TRIBE COMMAND')

  //NODE2 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
  const checkNode2 = await shouldNotGetNewMsgs(t, node2, updateCall.uuid)
  t.true(checkNode2, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND')

  //NODE3 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
  const checkNode3 = await shouldNotGetNewMsgs(t, node3, updateCall.uuid)
  t.true(checkNode3, 'NODE 3 SHOULD NOT SEE THE UPDATE TRIBE COMMAND')

  //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE UPDATE COMMAND
  let botAlias = 'CallRecordingBot'
  const botReply = await getCheckBotMsg(t, node1, botAlias, tribe, 1)
  t.truthy(botReply, 'CallRecordingBot should reply')

  //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE UPDATE CALL RECORDING COMMAND
  const botReply2 = await shouldNotGetBotRes(t, node2, botAlias)
  t.truthy(botReply2, 'CallRecordingBot should not reply to NODE2')

  //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE UPDATE CALL RECORDING COMMAND
  const botReply3 = await shouldNotGetBotRes(t, node3, botAlias)
  t.truthy(botReply3, 'CallRecordingBot should not reply to NODE3')

  //NODE1 USES THE THE HIDE COMMAND TO HIDE THE SETMESSAGE WELCOME BOT COMMAND
  const hideMsg = '/welcome hide setmessage'
  const hideMsgRes = await sendTribeMessage(t, node1, tribe, hideMsg)

  // NODE1 SHOULD SEE THE HIDE SETMESSAGE COMMAND
  const checkHideCmd = await getCheckNewMsgs(t, node1, hideMsgRes.uuid)
  t.truthy(checkHideCmd, 'NODE 1 SHOULD SEE THE HIDE COMMAND')

  //NODE2 SHOULD NOT SEE THE HIDE MESSAGE COMMAND
  const checkHideCmd2 = await shouldNotGetNewMsgs(t, node2, hideMsgRes.uuid)
  t.true(checkHideCmd2, 'NODE 2 SHOULD NOT SEE THE HIDE COMMAND')

  //NODE3 SHOULD NOT SEE THE HIDE MESSAGE COMMAND
  const checkHideCmd3 = await shouldNotGetNewMsgs(t, node3, hideMsgRes.uuid)
  t.true(checkHideCmd3, 'NODE 3 SHOULD NOT SEE THE HIDE COMMAND')

  //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE HIDE COMMAND
  let welcomeBotRes = 'WelcomeBot'
  const welcomeBotReply = await getCheckBotMsg(
    t,
    node1,
    welcomeBotRes,
    tribe,
    1
  )
  t.truthy(welcomeBotReply, 'WelcomeBot should reply')

  //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE HIDE SET MESSAGE COMMAND
  const welcomeBotReply1 = await shouldNotGetBotRes(t, node2, welcomeBotRes)
  t.truthy(welcomeBotReply1, 'WelcomeBot should not reply')

  //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE HIDE SET MESSAGE COMMAND
  const welcomeBotReply2 = await shouldNotGetBotRes(t, node3, welcomeBotRes)
  t.truthy(welcomeBotReply2, 'WelcomeBot should not reply')

  //NODE1 SETS WELCOME BOT MESSAGE
  const setMsg = '/welcome setmessage Welcome to the new tribe'
  const setMsgRes = await sendTribeMessage(t, node1, tribe, setMsg)

  //NODE2 SHOULD NOT TO SEE THE MESSAGE USED TO SET THE WELCOME MESSAGE
  const checkSetMsgCmd = await shouldNotGetNewMsgs(t, node2, setMsgRes.uuid)
  t.true(checkSetMsgCmd, 'NODE 2 SHOULD NOT SEE THE SETMESSAGE COMMAND')

  //NODE3 SHOULD NOT TO SEE THE MESSAGE USED TO SET THE WELCOME MESSAGE
  const checkSetMsgCmd2 = await shouldNotGetNewMsgs(t, node3, setMsgRes.uuid)
  t.true(checkSetMsgCmd2, 'NODE 3 SHOULD NOT SEE THE SETMESSAGE COMMAND')

  //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
  let welcomeBotAlias = 'WelcomeBot'
  const setMsgReply = await getCheckBotMsg(t, node1, welcomeBotAlias, tribe, 2)
  t.truthy(setMsgReply, 'WelcomeBot should reply')

  //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
  const welcomeBotReply3 = await shouldNotGetBotRes(t, node2, welcomeBotAlias)
  t.truthy(welcomeBotReply3, 'WelcomeBot should not reply')

  //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
  const welcomeBotReply4 = await shouldNotGetBotRes(t, node3, welcomeBotAlias)
  t.truthy(welcomeBotReply4, 'WelcomeBot should not reply')

  //NODE2 LEAVES THE TRIBE
  let left = await leaveTribe(t, node2, tribe)
  t.true(left, 'node2 should leave tribe')

  //NODE3 LEAVES THE TRIBE
  let left2 = await leaveTribe(t, node3, tribe)
  t.true(left2, 'node3 should leave tribe')

  //NODE1 DELETES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
