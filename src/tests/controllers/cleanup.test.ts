import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { getContacts } from '../utils/get'
import { deleteContact } from '../utils/del/deleteContact'
import { asyncForEach } from '../utils/helpers'
import { NodeConfig } from '../types'

/*
  npx ava src/tests/controllers/cleanup.test.ts --verbose --serial --timeout=2m
*/
interface Context {}

test.serial('cleanup contacts', async (t: ExecutionContext<Context>) => {
  await asyncForEach(nodes, async (node1: NodeConfig) => {
    console.log('=> cleanup', node1.alias)
    const all = await getContacts(t, node1)
    for (const contact of all) {
      if (contact.public_key !== node1.pubkey) {
        const ok = await deleteContact(t, node1, contact.id)
        t.true(ok)
      }
    }
  })
})
