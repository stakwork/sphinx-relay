import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Chat } from '../../types'
import { getTribeIdFromUUID } from '../get'

export async function deleteTribe(
  t: Assertions,
  node: NodeConfig,
  tribe: Chat
) {
  const tribeId = await getTribeIdFromUUID(t, node, tribe)
  t.truthy(tribeId, 'node should get tribe id')

  //node deletes the tribe
  let del = await http.del(
    node.external_ip + '/chat/' + tribeId,
    makeArgs(node)
  )
  t.true(del.success, 'node1 should delete the tribe')

  return true
}
