import test from 'ava'

import { randomText } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessage, checkMessageDecryption } from '../utils/msg'

import nodes from '../nodes'

/*
npx ava test-10-tribe3Msgs.js --verbose --serial --timeout=2m
*/

test('test-10-tribe3Msgs: create tribe, two nodes join tribe, send messages, 2 nodes leave tribe, delete tribe', async (t) => {
  await tribe3Msgs(t, nodes[0], nodes[1], nodes[2])
})

export async function tribe3Msgs(t, node1, node2, node3) {
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
