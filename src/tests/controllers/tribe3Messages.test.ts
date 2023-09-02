import test from 'ava'
import * as http from 'ava-http'
import { config } from '../config'
import { makeArgs, randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessage, checkMessageDecryption } from '../utils/msg'
import { getCheckNewMsgs, getTribeByUuid, getCheckTribe } from '../utils/get'

import nodes from '../nodes'

/*
npx ava src/tests/controllers/tribe3Messages.test.ts --verbose --serial --timeout=2m
*/

test('test-10-tribe3Msgs: create tribe, two nodes join tribe, send messages, 2 nodes leave tribe, delete tribe', async (t) => {
  await tribe3Msgs(t, nodes[0], nodes[1], nodes[2])
})

export async function tribe3Msgs(t, node1, node2, node3) {
  // if running "no-alice" version with local relay
  const internalTribeHost = node1.ip.includes('host.docker.internal')
    ? config.tribeHost
    : config.tribeHostInternal
  //THREE NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>

  t.truthy(node3, 'this test requires three nodes')

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

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text = randomText()
  let tribeMessage = await sendTribeMessage(t, node1, tribe, text)

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n2check = await checkMessageDecryption(
    t,
    node2,
    tribeMessage.uuid,
    text
  )
  t.true(n2check, 'node2 should have read and decrypted node1 message')

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check = await checkMessageDecryption(
    t,
    node3,
    tribeMessage.uuid,
    text
  )
  t.true(n3check, 'node3 should have read and decrypted node1 message')

  //NODE2 SENDS A TEXT MESSAGE IN TRIBE
  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessage(t, node2, tribe, text2)

  //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n1check = await checkMessageDecryption(
    t,
    node1,
    tribeMessage2.uuid,
    text2
  )
  t.true(n1check, 'node1 should have read and decrypted node2 message')

  //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check2 = await checkMessageDecryption(
    t,
    node3,
    tribeMessage2.uuid,
    text2
  )
  t.true(n3check2, 'node3 should have read and decrypted node2 message')

  //NODE3 SENDS A TEXT MESSAGE IN TRIBE
  const text3 = randomText()
  let tribeMessage3 = await sendTribeMessage(t, node3, tribe, text3)

  //CHECK THAT NODE3'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n1check2 = await checkMessageDecryption(
    t,
    node1,
    tribeMessage3.uuid,
    text3
  )
  t.true(n1check2, 'node1 should have read and decrypted node3 message')

  //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n2check2 = await checkMessageDecryption(
    t,
    node2,
    tribeMessage3.uuid,
    text3
  )
  t.true(n2check2, 'node2 should have read and decrypted node3 message')

  /*****
				Here we want to create a new message channel for a tribe
******/
  //Here we are going to try and add a new channel to the tribe in tribe server

  const createChannelBody = {
    tribe_uuid: tribe.uuid,
    host: internalTribeHost,
    name: 'testChannel',
  }

  const createChannelBody2 = {
    tribe_uuid: tribe.uuid,
    host: internalTribeHost,
    name: 'testChannel2',
  }

  await sleep(1000)
  const tribeSeverAddChannelResponse = await http.post(
    node1.external_ip + '/tribe_channel',
    makeArgs(node1, createChannelBody)
  )
  await sleep(1000)
  const tribeSeverAddChannelResponse2 = await http.post(
    node1.external_ip + '/tribe_channel',
    makeArgs(node1, createChannelBody2)
  )
  console.log(tribeSeverAddChannelResponse, tribeSeverAddChannelResponse2)

  //Here we get the tribe which should have the correct channels
  const r = await getCheckTribe(t, node1, tribe.id)
  const channelTribe = await getTribeByUuid(t, r)
  console.log(channelTribe)
  t.true(
    tribeSeverAddChannelResponse.response.id == channelTribe.channels[0].id,
    'First tribe added should have an id of the response we get back when we call for tribes'
  )
  t.true(
    tribeSeverAddChannelResponse2.response.id == channelTribe.channels[1].id,
    'second tribe added should have an id of the response we get back when we call for tribes'
  )
  t.true(
    tribeSeverAddChannelResponse.response.name == createChannelBody.name &&
      tribeSeverAddChannelResponse2.response.name == createChannelBody2.name,
    'the response should send back the correct channel name'
  )
  t.true(
    tribeSeverAddChannelResponse.response.tribe_uuid ==
      createChannelBody.tribe_uuid &&
      tribeSeverAddChannelResponse2.response.tribe_uuid ==
        createChannelBody2.tribe_uuid,
    'the tribes channels that returned should have the same tribe_uuid that we sent'
  )
  t.true(
    channelTribe.channels.length == 2,
    'the amount of channels in this new tribe should be 2'
  )

  //NODE3 SENDS A TEXT MESSAGE IN TRIBE
  const text4 = randomText()
  const options = { parent_id: 1, thread_uuid: 'thread_uuid' }
  let tribeMessage4 = await sendTribeMessage(t, node3, tribe, text4, options)
  const recivedMessageFromNode1 = await getCheckNewMsgs(
    t,
    node1,
    tribeMessage4.uuid
  )
  const recivedMessageFromNode2 = await getCheckNewMsgs(
    t,
    node1,
    tribeMessage4.uuid
  )

  t.true(
    recivedMessageFromNode1.parent_id == options.parent_id,
    'Node 1 gets message channel id'
  )
  t.true(
    recivedMessageFromNode2.parent_id == options.parent_id,
    'node 2 gets message channel id'
  )
  t.true(
    recivedMessageFromNode1.thread_uuid == options.thread_uuid,
    'Node 1 gets message thread uuid'
  )
  t.true(
    recivedMessageFromNode2.thread_uuid == options.thread_uuid,
    'node 2 gets message thread uuid'
  )
  //CHECK THAT NODE3'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n1check3 = await checkMessageDecryption(
    t,
    node1,
    tribeMessage4.uuid,
    text4
  )
  t.true(n1check3, 'node1 should have read and decrypted node3 message')

  //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n2check3 = await checkMessageDecryption(
    t,
    node2,
    tribeMessage4.uuid,
    text4
  )
  t.true(n2check3, 'node2 should have read and decrypted node3 message')

  //delete channel
  const deleteChannel1Body = {
    id: channelTribe.channels[0].id,
    host: internalTribeHost,
  }
  const deleteChannel2Body = {
    id: channelTribe.channels[1].id,
    host: internalTribeHost,
  }
  await http.del(
    node1.external_ip + '/tribe_channel',
    makeArgs(node1, deleteChannel1Body)
  )

  await http.del(
    node1.external_ip + '/tribe_channel',
    makeArgs(node1, deleteChannel2Body)
  )
  const channelTribe2 = await getTribeByUuid(t, r)
  t.true(
    channelTribe2.channels.length == 0,
    'there should not be anymore channels in the tribe'
  )

  //NODE2 LEAVES THE TRIBE
  let n2left = await leaveTribe(t, node2, tribe)
  t.true(n2left, 'node2 should leave tribe')

  //NODE3 LEAVES THE TRIBE
  let n3left = await leaveTribe(t, node3, tribe)
  t.true(n3left, 'node3 should leave tribe')

  //NODE1 DELETES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
