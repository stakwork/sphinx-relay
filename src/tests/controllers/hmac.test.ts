import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { NodeConfig } from '../types'
import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../utils/helpers'
import * as rsa from '../../crypto/rsa'
import * as crypto from 'crypto'

/*
npx ava src/tests/controllers/hmac.test.ts --verbose --serial --timeout=2m
*/
/*
sqlite3 /Users/evanfeenstra/code/sphinx/sphinx-stack/relay/db/alice.db

*/

interface Context {}

test.serial('hmacTest', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  //   await iterate(nodes, async (node1, node2) => {
  //     await checkContactsWithHmac(t, node1, node2)
  //   })
  await checkContactsWithHmac(t, nodes[0], nodes[1])
})

async function checkContactsWithHmac(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  console.log(`=> checkContactsWithHmac ${node1.alias} -> ${node2.alias}`)
  // NODE1 ADDS NODE2 AS A CONTACT
  // contact_key should be populated via key exchange in a few seconds
  const key = crypto.randomBytes(20).toString('hex').toLowerCase()
  const success = await addHmacKey(t, node1, key)
  console.log('HMAC:', success)
  let added = await addContact(t, node1, node2, key)
  t.true(added, 'node1 should add node2 as contact')
  console.log('added contact!')

  console.log('sent message!')
}

async function addHmacKey(t: Assertions, node1: NodeConfig, key: string) {
  const body = {
    encrypted_key: rsa.encrypt(node1.transportToken, key),
  }
  const added = await http.post(
    node1.external_ip + '/hmac_key',
    makeArgs(node1, body)
  )
  t.true(
    typeof added.response === 'object',
    'add hmac key should return object'
  )
  console.log('ADDED HMAC KEY!')
  return added.response
}

async function addContact(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  key
): Promise<boolean> {
  //object of node2node for adding as contact
  const body = {
    alias: `${node2.alias}`,
    public_key: node2.pubkey,
    status: 1,
    route_hint: node2.routeHint || '',
  }

  //node1 adds node2 as contact
  const add = await http.post(
    node1.external_ip + '/contacts',
    makeArgs(node1, body, {
      hmacOptions: {
        method: 'POST',
        path: '/contacts',
        key,
      },
    })
  )
  t.true(typeof add.response === 'object', 'add contact should return object')
  console.log('add.response', add.response)
  //create node2 id based on the post response
  var node2id = add && add.response && add.response.id
  //check that node2id is a number and therefore exists (contact was posted)
  t.true(typeof node2id === 'number', 'node1id should be a number')

  let failed = false
  try {
    // should fail!!!
    const add = await http.post(
      node1.external_ip + '/contacts',
      makeArgs(node1, body, {
        hmacOptions: {
          method: 'NOT_REAL',
          path: '/contacts',
          key,
        },
      })
    )
    t.falsy(add)
  } catch (e) {
    // should fail
    console.log('correctly failed')
    failed = true
  }
  t.true(failed, 'should have failed with bad hmac message')

  return true
}
