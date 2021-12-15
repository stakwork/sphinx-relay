import { decrypt } from '../../electronjs/rsa'
import { getCheckNewMsgs } from '../get'

export async function botDecrypt(t, node, text, msg) {
  //CHECK THAT THE MESSAGE SENT BY BOT INCLUDES DESIRED TEXT ===>

  const lastMsg = await getCheckNewMsgs(t, node, msg.uuid)

  //decrypt the last message sent to node using node private key and lastMsg content
  const decryptValue = decrypt(node.privkey, lastMsg.message_content)
  //the decrypted message should equal the random string input before encryption
  // console.log("TEXT === ", text)
  t.true(
    decryptValue.includes(text),
    'decrypted bot text should include pre-encryption text'
  )

  return true
}
