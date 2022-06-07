import { Assertions } from 'ava'
import http = require('ava-http')
import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'
import { Contact } from '../../types/jsonModels'

export const getSelf = async (
  t: Assertions,
  node: NodeConfig
): Promise<Contact> => {
  const r = await http.get(node.external_ip + '/contacts', makeArgs(node))
  t.true(r.success, 'should get node contacts')
  const nodeContact = r.response.contacts.find(
    (contact) => contact.public_key === node.pubkey
  )
  t.true(
    typeof nodeContact === 'object',
    'node should be its own first contact'
  )

  return nodeContact
}
