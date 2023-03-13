import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
// import { getContactAndCheckKeyExchange } from '../get'
import { NodeConfig } from '../../types'

interface cache {
  alias: string
  contact_key: string
  pub_key: string
}

export async function addMemberToTribe(
  t: Assertions,
  node1: NodeConfig,
  tribe,
  cache_details: cache
): Promise<boolean> {
  //object of node2node for adding as contact
  const body = {
    chat_id: tribe.id,
    ...cache_details,
  }

  //node1 adds node2 as contact
  const add = await http.post(
    node1.external_ip + '/tribe_member',
    makeArgs(node1, body)
  )
  t.true(add.success, 'node1 should be have added cache user to tribe')
  return true
}
