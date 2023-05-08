import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function disappearingMessages(
  t: Assertions,
  node: NodeConfig
): Promise<boolean> {
  let deletion = await http.del(node.external_ip + '/messages', makeArgs(node))
  t.true(deletion.success, 'node should delete the messages')
  return true
}
