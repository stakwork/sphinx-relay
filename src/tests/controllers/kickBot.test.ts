import test from 'ava'
import nodes from '../nodes'
import { createTribe, joinTribe } from '../utils/save'
import { getCheckBotMsg, checkTribeMember } from '../utils/get'
import { sendTribeMessage } from '../utils/msg'
import { deleteTribe, leaveTribe } from '../utils/del'
import { sleep } from '../utils/helpers'

/*
npx ava src/tests/controllers/kickBot.test.ts --verbose --serial --timeout=2m
*/

test('test kick bot: create tribe, join tribe, add user to blacklist, remove user from blacklist, leave tribe, delete tribe', async (t) => {
  await kickBotTest(t, 0, 1, 2)
})

export async function kickBotTest(t, index1, index2, index3) {
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE1 SENDS A BOT HELP MESSAGE IN TRIBE
  const text = '/bot help'
  await sendTribeMessage(t, node1, tribe, text)

  //NODE1 AWAIT REPLY FROM BOT
  let botAlias = 'MotherBot'
  const botReply = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply, 'MotherBot should reply')

  //NODE1 Installs kick bot
  const text2 = '/bot install kick'
  await sendTribeMessage(t, node1, tribe, text2)

  //AWAIT KICK BOT RESPONSE
  botAlias = 'MotherBot'
  const botReply2 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply2, 'MotherBot should reply')

  //NODE2 JOINS TRIBE
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE1 KICKS NODE2 OUT OF THE TRIBE AND ADDED NODE2 TO BLACKLIST
  const addPubkey = `/kick add ${node2.pubkey}`
  await sendTribeMessage(t, node1, tribe, addPubkey)

  //AWAIT KICK BOT RESPONSE
  botAlias = 'KickBot'
  const botReply3 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply3, 'MotherBot should reply')

  //NODE1 CHECKS TRIBE MEMBERS AND NODE2 SHOULD NOT BE A MEMBER
  const member = await checkTribeMember(t, node1, node2, tribe)
  t.false(member, 'Node2 should not be a member of the tribe')

  //NODE2 DELETE TRIBE
  let delTribe = await deleteTribe(t, node2, tribe)
  t.true(delTribe, 'node2 should delete tribe for himself')

  //NODE2 TRIES TO JOIN TRIBE AGAIN
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node2, tribe)
  t.true(join2, 'node2 should join tribe')

  botAlias = 'KickBot'
  const botReply8 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply8, 'MotherBot should reply')

  //NODE2 DELETE TRIBE
  let delTribe2 = await deleteTribe(t, node2, tribe)
  t.true(delTribe2, 'node2 should delete tribe for himself')

  //NODE2 SHOULD NOT BE PART OF THIS TRIBE AGAIN
  const member2 = await checkTribeMember(t, node1, node2, tribe)
  t.false(member2, 'Node2 should not be a member of the tribe')

  //NODE1 REMOVES NODE2 FROM BLACKLIST
  const removePubkey = `/kick remove ${node2.pubkey}`
  await sendTribeMessage(t, node1, tribe, removePubkey)

  //AWAIT KICK BOT RESPONSE
  botAlias = 'KickBot'
  const botReply4 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply4, 'MotherBot should reply')

  //NODE2 JOINS TRIBE AGAIN AND SHOULD BE ABLE TO JOIN TRIBE
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join3 = await joinTribe(t, node2, tribe)
  t.true(join3, 'node2 should join tribe')

  //CHECK IF NODE2 IS NOW A TRIBE MEMBER
  const member3 = await checkTribeMember(t, node1, node2, tribe)
  t.true(member3, 'Node2 should be a member of the tribe')

  //NODE1 ADDS NODE3 TO BLACKLIST
  const addPubkey2 = `/kick add ${node3.pubkey}`
  await sendTribeMessage(t, node1, tribe, addPubkey2)

  //AWAIT KICK BOT RESPONSE
  botAlias = 'KickBot'
  const botReply5 = await getCheckBotMsg(t, node1, botAlias)
  t.truthy(botReply5, 'MotherBot should reply')

  //NODE3 TRIES TO JOIN TRIBE
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join4 = await joinTribe(t, node3, tribe)
  t.true(join4, 'node4 should join tribe')

  // botAlias = 'KickBot'
  // const botReply7 = await getCheckBotMsg(t, node1, botAlias)
  // t.truthy(botReply7, 'MotherBot should reply')

  //DELETE TRIBE BY NODE3 AFTER BEING KICKED OUT
  let delTribe3 = await deleteTribe(t, node3, tribe)
  t.true(delTribe3, 'node3 should delete tribe for himself')

  //NODE3 TRIES TO JOIN TRIBE
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join5 = await joinTribe(t, node3, tribe)
  t.true(join5, 'node4 should join tribe')

  //DELETE TRIBE BY NODE3 AFTER BEING KICKED OUT
  let delTribe5 = await deleteTribe(t, node3, tribe)
  t.true(delTribe5, 'node3 should delete tribe for himself')

  await sleep(30000)

  //CHECK IF NODE3 IS A TRIBE MEMBER
  const member4 = await checkTribeMember(t, node1, node3, tribe)
  t.false(member4, 'Node3 should not be a member of the tribe')

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE1 DELETE TRIBE
  let delTribe4 = await deleteTribe(t, node1, tribe)
  t.true(delTribe4, 'node1 should delete tribe')
}
