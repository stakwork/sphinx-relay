import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { getCheckContacts } from '../get'

export async function addContact(t: Assertions, node1, node2) {
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
    makeArgs(node1, body)
  )
  t.true(typeof add.response === 'object', 'add contact should return object')
  //create node2 id based on the post response
  var node2id = add && add.response && add.response.id
  //check that node2id is a number and therefore exists (contact was posted)
  t.true(typeof node2id === 'number', 'node1id should be a number')

  //await contact_key
  const [n1contactP1, n2contactP1] = await getCheckContacts(t, node1, node2)

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
