import test from 'ava'
import { randomText, sleep } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe, addMemberToTribe } from '../utils/save'
import { sendTribeMessage } from '../utils/msg'
import nodes from '../nodes'
import { getCacheMsg, getMsgByUuid } from '../utils/get'

/*
npx ava src/tests/controllers/cache.test.ts --verbose --serial --timeout=2m
*/

test('test cache: create tribe, join tribe, send messages,verify message got to tribe, leave tribe, delete tribe', async (t) => {
  await cacheMessage(t, 3, 1, 2)
})

export async function cacheMessage(t, index1, index2, index3) {
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]

  console.log(
    `Checking cache messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`
  )

  //NODE4 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node4')

  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE4 Adds Cache member
  const addMember = await addMemberToTribe(t, node1, tribe, {
    alias: 'cache',
    pub_key:
      '03f3a6e1b400e29f1a101391660005f0d44d6d18efa3b293b34a084d98d4664f7b',
    contact_key:
      'MIIBCgKCAQEAt2RSUo/xlB1dGQBn6Ko4j6w6FyLIQ7CL47qm4ihDapne6bG5dmiBT3lcGmrvjLBJqIKHLejhgRY2VgVU8YK0R94/HWWyz709d7nLhtYBbdWmwIjGD7aDxeRX5ATp0THZbEebfUc/237iqD5Enf6pmzdD9JQgtFU9A8uNjexuULmV1Kq2nr3w2OUlTP1a84UP1Qs0XSlFA0HOBj6OLGcP/VD7H4wbfrZXCIMGQo4LPy+htM4k31Qn0K3LgKfU1bKHzJk+kGYTHThOEpHRUIbd8lOAnZwzIg0P47QvY1pVs5Te26sXvnt5Uxj+hrilg829GfvrIG/TDzb1EXIqZmwM3wIDAQAB',
  })
  t.true(addMember, 'node4 should have added new user to tribe')

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
  t.true(msgExist, 'Message should be seen by node 1')

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
