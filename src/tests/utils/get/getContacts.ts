import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { NodeConfig } from '../../types'
import { Assertions } from 'ava'
import { Contact } from '../../types'

export async function getContacts(
  t: Assertions,
  node1: NodeConfig,
  node2?: NodeConfig
): Promise<Contact[]> {
  //get list of contacts from node1 perspective
  const res = await http.get(
    node1.external_ip + '/contacts?unmet=include',
    makeArgs(node1)
  )
  //create node1 contact object from node1 perspective
  let n1contactP1 = res.response.contacts.find(
    (contact) => contact.public_key === node1.pubkey
  )
  t.true(typeof n1contactP1 === 'object')
  if (node2) {
    //create node1 contact object from node2 perspective
    let n2contactP1 = res.response.contacts.find(
      (contact) => contact.public_key === node2.pubkey
    )
    t.true(typeof n2contactP1 === 'object')
  }

  return res.response.contacts
}
