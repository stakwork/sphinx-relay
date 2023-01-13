import test from 'ava'
import { deleteTribe, leaveTribe } from '../utils/del'
import { botDecrypt } from '../utils/bots'
import { createTribe, joinTribe } from '../utils/save'
import { getCheckBotMsg } from '../utils/get'
import { sendTribeMessage } from '../utils/msg'
import nodes from '../nodes'

//var h = require('../utils/helpers')
//var r = require('../test-config')

/*
npx ava src/tests/controllers/botCreation.test.ts --verbose --serial --timeout=2m
*/

test('test-30-botCreation: create tribe, create bot, add bot to tribe, delete bot, delete tribe', async (t) => {
  await botCreation(t, nodes[0], nodes[1], nodes[2])
})

async function botCreation(t, node1, node2, node3) {
  //CHECK BOT CREATION WITHIN A TRIBE ===>

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE1 SENDS A BOT HELP MESSAGE IN TRIBE
  const text = '/bot help'
  await sendTribeMessage(t, node1, tribe, text)

  //NODE1 AWAIT REPLY FROM BOT
  let botAlias = 'MotherBot'
  const botReply = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply, 'MotherBot should reply')
  // console.log("BOTREPLY === ", JSON.stringify(botReply))

  const textCall = '/bot install callRecording'
  await sendTribeMessage(t, node1, tribe, textCall)

  //NODE1 SENDS A BOT INSTALL MESSAGE IN TRIBE
  const text2 = '/bot install welcome'
  await sendTribeMessage(t, node1, tribe, text2)

  //NODE1 AWAIT REPLY FROM BOT
  botAlias = 'MotherBot'
  const botReply2 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply2, 'MotherBot should reply')
  // console.log("BOTREPLY === ", JSON.stringify(botReply2))

  const meeting =
    'https://jitsi.sphinx.chat/sphinx.call.694995623.221505#config.startAudioOnly=true'
  await sendTribeMessage(t, node1, tribe, meeting)

  //NODE1 SENDS A BOT SET WELCOME MESSAGE IN TRIBE
  const setMessage = '/welcome setmessage '
  const newWelcomeMessage = "You're in my test tribe now"
  const text3 = setMessage + newWelcomeMessage
  await sendTribeMessage(t, node1, tribe, text3)

  //NODE1 AWAIT REPLY FROM BOT
  botAlias = 'WelcomeBot'
  const botReply3 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply3, 'WelcomeBot should reply')
  // console.log("BOTREPLY === ", JSON.stringify(botReply3))

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE3 AWAIT REPLY FROM BOT
  botAlias = 'WelcomeBot'
  const botReply4 = await getCheckBotMsg(t, node3, botAlias)
  t.truthy(botReply4, 'WelcomeBot should reply')
  // console.log("BOTREPLY === ", JSON.stringify(botReply3))

  //CHECK THAT BOT'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check = await botDecrypt(t, node3, newWelcomeMessage, botReply4)
  t.true(n3check, "node3 should have read and decrypted bot's message")

  // //CREATE NEW BOT
  // const newBot = await f.botCreate(t, node1, "TestBot", "https://sphinx-random.herokuapp.com/")
  // t.true(newBot.success, "new bot should have been created")

  // const checkBots = await f.getBots(t, node1)
  // console.log('CHECK BOTS === ', JSON.stringify(checkBots.bots))

  //     //NODE1 SENDS A BOT SEARCH MESSAGE IN TRIBE
  //     const text8 = "/bot search TestBot"
  //     let tribeMessage8 = await f.sendTribeMessage(t, node1, tribe, text8)
  //     t.true(tribeMessage8.success, "node1 should seach for new bot")

  //             //NODE1 SENDS A BOT INSTALL MESSAGE IN TRIBE
  //             const text9 = "/bot install testbot"
  //             let tribeMessage9 = await f.sendTribeMessage(t, node1, tribe, text9)
  //             t.true(tribeMessage9.success, "node1 should install the new bot")

  //                 await h.sleep(5000)

  //                             //NODE1 SENDS A TESTBOT MESSAGE IN TRIBE
  //                             const text10 = "/testbot 8"
  //                             let tribeMessage10 = await f.sendTribeMessage(t, node1, tribe, text10)
  //                             t.true(tribeMessage10.success, "node1 should send a message to new bot")

  //                             await h.sleep(5000)

  // const delBot = await f.botDelete(t, node1, newBot.bot.id)
  // console.log("BOT DELETE === ", delBot.bot)

  //                                 //NODE1 SENDS A TESTBOT MESSAGE IN TRIBE
  //                                 const text11 = "/bot uninstall testbot"
  //                                 let tribeMessage11 = await f.sendTribeMessage(t, node1, tribe, text11)
  //                                 t.true(tribeMessage11.success, "node1 should send a message to new bot")

  // const checkBots2 = await f.getBots(t, node1)
  // console.log("CHECK BOTS === ", JSON.stringify(checkBots2))

  // await h.sleep(5000)

  // return

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
