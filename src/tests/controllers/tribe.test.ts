import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { leaveTribe, deleteTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { randomText, iterate } from '../utils/helpers'
import { NodeConfig } from '../types'
import { sendTribeMessageAndCheckDecryption } from '../utils/msg'

/*
    npx ava src/tests/controllers/tribe.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribe', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await iterate(nodes, async (node1, node2) => {
    await tribeTest(t, node1, node2)
  })
})

async function tribeTest(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text = randomText()
  let tribeMessage = await sendTribeMessageAndCheckDecryption(
    t,
    node1,
    node2,
    text,
    tribe
  )
  t.true(tribeMessage, 'node1 should send message to tribe')

  //NODE2 SENDS A TEXT MESSAGE IN TRIBE
  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
    t,
    node2,
    node1,
    text2,
    tribe
  )
  t.true(tribeMessage2, 'node1 should send message to tribe')

  //NODE2 LEAVES THE TRIBE
  let left = await leaveTribe(t, node2, tribe)
  t.true(left, 'node2 should leave tribe')

  //NODE2 LEAVES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
