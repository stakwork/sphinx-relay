import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { deleteTribe } from '../utils/del'
import { getCheckTribe } from '../utils/get'
import { createTribe, pinMsgToTribe, joinTribe } from '../utils/save'
import { NodeConfig } from '../types'

/*
    npx ava src/tests/controllers/pinnedMsg.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribe pinned msg', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await tribeTest(t, nodes[0], nodes[1])
})

async function tribeTest(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  const pin = await pinMsgToTribe(t, node1, tribe.id, 'PIN')
  t.true(pin === 'PIN', 'pin should equal')

  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //FETCH TRIBE FROM TRIBE SERVER TO CHECK EDITS
  console.log('fetch tribe')
  const tribeFetch = await getTribeByUuid(t, tribe)
  t.true(typeof tribeFetch === 'object', 'fetched tribe object should exist')
  t.true(
    tribeFetch.pin === 'PIN',
    'tribe server should show correct pinned message'
  )
  /*let node1Tribe = await getCheckTribe(t, node1, tribe.id)
  let node2Tribe = await getCheckTribe(t, node2, tribe.id)
  t.true(node1Tribe.pin === 'PIN')
  t.true(node2Tribe.pin === 'PIN')
	*/

  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
