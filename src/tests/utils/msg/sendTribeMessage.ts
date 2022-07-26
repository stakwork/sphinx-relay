import * as http from 'ava-http'

import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import { getSelf } from '../get'
import { Message, Chat } from '../../types'
import { makeArgs } from '../helpers'

import * as rsa from '../../../crypto/rsa'
import { getTribeIdFromUUID } from '../get'

interface SendMessageOptions {
  amount?: number
  parent_id?: number
}

export async function sendTribeMessage(
  t: Assertions,
  node1: NodeConfig,
  tribe: Chat,
  text: string,
  options?: SendMessageOptions
): Promise<Message> {
  //NODE1 SENDS TEXT MESSAGE TO NODE2
  const node1contact = await getSelf(t, node1)

  //encrypt random string with node1 contact_key
  const encryptedText = rsa.encrypt(node1contact.contact_key, text)

  //encrypt random string with node2 contact_key
  const remoteText = rsa.encrypt(tribe.group_key, text)

  //create message object with encrypted texts
  const tribeId = await getTribeIdFromUUID(t, node1, tribe)
  t.true(typeof tribeId === 'number', 'node should get tribe id')

  const v = {
    contact_id: null,
    chat_id: tribeId,
    text: encryptedText,
    remote_text_map: { chat: remoteText },
    amount: (options && options.amount) || 0,
    parent_id: (options && options.parent_id) || 0,
    reply_uuid: '',
    boost: false,
  }

  //send message from node1 to node2
  const msg = await http.post(
    node1.external_ip + '/messages',
    makeArgs(node1, v)
  )
  t.true(msg.success, 'node should send message to tribe')

  return msg.response
}
