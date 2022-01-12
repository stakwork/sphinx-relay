import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import * as rsa from '../../../crypto/rsa'
import { getContactAndCheckKeyExchange } from '../get'
import { makeArgs } from '../helpers'
import { Message } from '../../types'

interface SendMessageOptions {
  amount: number
}

// send a message
// and decrypt with node2 RSA key
// and check the text matches
export async function sendMessage(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  text: string,
  options?: SendMessageOptions
): Promise<Message> {
  //NODE1 SENDS TEXT MESSAGE TO NODE2
  const [node1contact, node2contact] = await getContactAndCheckKeyExchange(
    t,
    node1,
    node2
  )

  //encrypt random string with node1 contact_key
  const encryptedText = rsa.encrypt(node1contact.contact_key, text)
  //encrypt random string with node2 contact_key
  const remoteText = rsa.encrypt(node2contact.contact_key, text)
  //create message object with encrypted texts
  const v = {
    contact_id: node2contact.id,
    chat_id: null,
    text: encryptedText,
    remote_text_map: { [node2contact.id]: remoteText },
    amount: (options && options.amount) || 0,
    reply_uuid: '',
    boost: false,
  }

  //send message from node1 to node2
  const msg = await http.post(
    node1.external_ip + '/messags',
    makeArgs(node1, v)
  )
  //make sure msg exists
  t.true(msg.success, 'msg should exist')

  return msg.response
}
