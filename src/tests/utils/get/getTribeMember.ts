import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { NodeConfig, Contact } from '../../types'
import { Assertions } from 'ava'

export async function getTribeMember(
  t: Assertions,
  node1: NodeConfig,
  tribeId: number
): Promise<Contact[]> {
  //get list of contacts from node1 perspective
  const res = await http.get(
    node1.external_ip + '/contacts/' + tribeId,
    makeArgs(node1)
  )

  t.truthy(res.response.contacts, 'There should be tribe members')
  return res.response.contacts
}
