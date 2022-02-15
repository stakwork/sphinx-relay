import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { deleteTribe } from '../utils/del'
import { createTribe, pinMsgToTribe } from '../utils/save'
import { NodeConfig } from '../types'

/*
    npx ava src/tests/controllers/pinnedMsg.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribe pinned msg', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await tribeTest(t, nodes[0])
})

async function tribeTest(t: ExecutionContext<Context>, node1: NodeConfig) {
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  const pin = await pinMsgToTribe(t, node1, tribe.id, 'PIN')
  t.true(pin === 'PIN', 'pin should equal')

  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
