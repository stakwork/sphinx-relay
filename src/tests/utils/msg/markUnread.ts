import { NodeConfig, Chat } from '../../types'
import { makeArgs } from '../helpers'
import * as http from 'ava-http'

export async function markUnread(node: NodeConfig, chat_id: Chat) {
  const msg = await http.post(
    node.external_ip + `/messages/${chat_id.id}/toggleChatReadUnread`,
    makeArgs(node, { shouldMarkAsUnread: true })
  )
  return msg.response.new_messages
}
