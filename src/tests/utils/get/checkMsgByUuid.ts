import { Assertions } from 'ava'
import { NodeConfig, Message } from '../../types'
import { getCheckAllMessages } from './getCheckAllMessages'

export async function getMsgByUuid(
  t: Assertions,
  node1: NodeConfig,
  message: Message
) {
  const msg = await getCheckAllMessages(t, node1, 1000, 0)
  if (msg && msg.new_messages && msg.new_messages.length) {
    for (let i = 0; i < msg.new_messages.length; i++) {
      const newMsg = msg.new_messages[i]
      if (newMsg.uuid === message.uuid) {
        return newMsg
      }
    }
    return false
  } else {
    return false
  }
}
