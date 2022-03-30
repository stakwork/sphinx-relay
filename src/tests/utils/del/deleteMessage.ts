import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function deleteMessage(
  t: Assertions,
  node: NodeConfig,
  id: number
): Promise<boolean> {
  let deletion = await http.del(
    node.external_ip + '/message/' + id,
    makeArgs(node)
  )
  t.true(deletion.success, 'node should delete the messages')
  return true
}
