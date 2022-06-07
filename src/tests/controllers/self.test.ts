import test, { ExecutionContext } from 'ava'
import { asyncForEach } from '../utils/helpers'
import nodes from '../nodes'
import { getSelf } from '../utils/get'

/*
    npx ava src/tests/controllers/self.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('checkSelf', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await asyncForEach(nodes, async (node) => {
    if (!node) return

    //get list of contacts as node
    const me = await getSelf(t, node)
    //check that the structure object
    t.true(typeof me === 'object') // json object by default
    //check that first contact public_key === node pubkey
    t.true(
      me.public_key === node.pubkey,
      'pubkey of first contact should be pubkey of node'
    )
    console.log(`${node.alias}: ${me.public_key}`)
  })
})
