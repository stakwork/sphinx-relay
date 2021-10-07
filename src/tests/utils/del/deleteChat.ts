import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function deleteChat(
  t: Assertions,
  node: NodeConfig,
  chatID: number
): Promise<boolean> {
  let deletion = await http.del(
    node.external_ip + '/chat/' + chatID,
    makeArgs(node)
  )
  t.true(deletion.success, 'node should delete the chat')
  return true
}
