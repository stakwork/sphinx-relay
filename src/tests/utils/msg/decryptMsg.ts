import * as rsa from '../../../crypto/rsa'
import { NodeConfig, Message } from '../../types'

export function decryptMessage(node: NodeConfig, message: Message) {
  const decrypt = rsa.decrypt(node.privkey, message.message_content)
  return decrypt
}
