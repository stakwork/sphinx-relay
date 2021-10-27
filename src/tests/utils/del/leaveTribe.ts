import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Chat } from '../../types'
import { getTribeIdFromUUID } from '../get'

export async function leaveTribe(t: Assertions, node: NodeConfig, tribe: Chat) {
  const tribeId = await getTribeIdFromUUID(t, node, tribe)
  t.true(typeof tribeId === 'number', 'node should get tribe id')

  //node2 leaves tribe
  const exit = await http.del(
    node.external_ip + `/chat/${tribeId}`,
    makeArgs(node)
  )
  //check exit
  t.true(exit.success, 'node should exit test tribe')

  return true
}
