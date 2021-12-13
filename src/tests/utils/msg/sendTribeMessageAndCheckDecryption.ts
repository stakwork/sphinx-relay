import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import { Message, Chat } from '../../types'
import { sendTribeMessage, checkMessageDecryption } from '../msg'

interface SendMessageOptions {
  amount: number
}

// send a message
// and decrypt with node2 RSA key
// and check the text matches
export async function sendTribeMessageAndCheckDecryption(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  text: string,
  tribe: Chat,
  options?: SendMessageOptions
): Promise<Message> {
  //send message from node1 to node2
  const msg = await sendTribeMessage(t, node1, tribe, text)

  const msgUuid = msg.uuid

  await checkMessageDecryption(t, node2, msgUuid, text)

  return msg
}
