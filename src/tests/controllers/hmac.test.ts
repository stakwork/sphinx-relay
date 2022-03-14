import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { getContactAndCheckKeyExchange } from '../utils/get'
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
        method: 'POSTi',
        path: '/contacts',
        key,
      },
    })
  )
  t.true(typeof add.response === 'object', 'add contact should return object')
  console.log(add.response)
  //create node2 id based on the post response
  var node2id = add && add.response && add.response.id
  //check that node2id is a number and therefore exists (contact was posted)
  t.true(typeof node2id === 'number', 'node1id should be a number')

  //await contact_key
  const [n1contactP1, n2contactP1] = await getContactAndCheckKeyExchange(
    t,
    node1,
    node2
  )

  //make sure node 2 has the contact_key
  t.true(
    typeof n2contactP1.contact_key === 'string',
    'node2 should have a contact key'
  )
  t.true(
    typeof n1contactP1 === 'object',
    'node1 should be its own first contact'
  )

  return true
}
