import { NodeConfig, Chat } from '../../types'
import { makeArgs } from '../helpers'
import * as http from 'ava-http'

export async function readMessages(node: NodeConfig, chat_id: Chat) {
  const msg = await http.post(
    node.external_ip + `/messages/${chat_id.id}/read`,
    makeArgs(node)
  )
  return msg.response.new_messages
}
