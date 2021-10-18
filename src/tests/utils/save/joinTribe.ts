import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { NodeConfig } from '../../types'
import { getCheckTribe } from '../get'

export async function joinTribe(t: Assertions, node: NodeConfig, tribe) {
  //NODE JOINS TRIBE ===>

  //node joins tribe
  const join = await http.post(node.ip + '/tribe', makeArgs(node, tribe))
  //check that join was successful
  t.true(join.success, 'node2 should join test tribe')
  const joinedTribeId = join.response.id

  //await arrival of new tribe in chats
  const check = await getCheckTribe(t, node, joinedTribeId)
  t.truthy(check, 'joined tribe should be in chats')

  return true
}
