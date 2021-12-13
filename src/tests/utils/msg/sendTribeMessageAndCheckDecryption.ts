import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as rsa from '../../../crypto/rsa'
import { getCheckNewMsgs } from '../get'
import { Message, Chat } from '../../types'
import { sendTribeMessage } from '../msg'

interface SendMessageOptions {
  amount: number
}

export async function checkDecryption(
  t: Assertions,
  node: NodeConfig,
  msgUuid,
  text
) {
  // //wait for message to process
  const lastMessage = await getCheckNewMsgs(t, node, msgUuid)
  t.truthy(lastMessage, 'await message post')

  //decrypt the last message sent to node using node private key and lastMessage content
  const decrypt = rsa.decrypt(node.privkey, lastMessage.message_content)

  //the decrypted message should equal the random string input before encryption
  t.true(decrypt === text, 'decrypted text should equal pre-encryption text')
  return true
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

  await checkDecryption(t, node2, msgUuid, text)

  return msg
}
