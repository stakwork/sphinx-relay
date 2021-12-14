import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as rsa from '../../../crypto/rsa'
import { getCheckNewMsgs } from '../get'

export async function checkMessageDecryption(
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
