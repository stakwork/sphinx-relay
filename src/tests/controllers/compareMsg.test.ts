import test from 'ava'
import { randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe, setTribePreview } from '../utils/save'
import { sendTribeMessage } from '../utils/msg'
import nodes from '../nodes'
import { getCacheMsg, getMsgByUuid, getMessageDiff } from '../utils/get'

/*
npx ava src/tests/controllers/cache.test.ts --verbose --serial --timeout=2m
*/

test('test cache: create tribe, join tribe, send messages,verify message got to tribe, compare relay and cache message, leave tribe, delete tribe', async (t) => {
  await cacheMessage(t, 3, 1, 2)
})

export async function cacheMessage(t, index1, index2, index3) {
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]

  console.log(
    `Comparing cache and relay messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`
  )

  //NODE4 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node4')

  let setPreview = await setTribePreview(t, node1, tribe, 'localhost:8008')
  t.true(setPreview, 'Node1 has added preview to tribe')

  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE1 SENDS A MESSAGE IN THE TRIBE AND NODE2 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
  const text = randomText()
  let tribeMessage1 = await sendTribeMessage(t, node1, tribe, text)
  t.truthy(tribeMessage1, 'node1 should send message to tribe')

  await sleep(1000)
  const cacheMsg = await getCacheMsg(t, tribe, tribeMessage1, text)
  t.true(cacheMsg, 'Message Should exist on Cache server')

  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessage(t, node2, tribe, text2)
  t.truthy(tribeMessage2, 'node2 should send message to tribe')

  await sleep(1000)
  const msgExist = await getMsgByUuid(t, node1, tribeMessage2)
  t.truthy(msgExist, 'Message should be seen by node 1')

  await sleep(1000)
  const msgExist2 = await getMsgByUuid(t, node3, tribeMessage2)
  t.truthy(msgExist2, 'Message should be seen by node 2')

  const compared = await getMessageDiff(t, msgExist2, msgExist)
  console.log(compared)
  t.truthy(
    compared,
    'There should be values in message directly from relay not present in cache message'
  )

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
