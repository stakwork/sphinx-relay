import { getAllMessages } from './index'
import { Message } from '../../types/jsonModels'
export async function getTribeMessages(t, node, tribe) {
  const allMessages = await getAllMessages(node)
  let tribeMessages: Message[] = []
  for (let i = 0; i < allMessages.length; i++) {
    const message = allMessages[i]
    if (tribe.id === message.chat_id) {
      tribeMessages.push(message)
    }
  }
  return tribeMessages
}
