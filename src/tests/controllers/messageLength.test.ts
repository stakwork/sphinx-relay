import test, { ExecutionContext } from 'ava'
import * as rsa from '../../crypto/rsa'
import { randomText, iterate, sleep } from '../utils/helpers'
import { addContact } from '../utils/save'
import { deleteContact, deleteMessages } from '../utils/del'
import { sendMessage } from '../utils/msg'
import { getContacts, getCheckMsgs, getCheckAllMessages } from '../utils/get'
import { Message, NodeConfig } from '../types'

import nodes from '../nodes'

/*
  npx ava src/tests/controllers/messageLength.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact',
  async (t: ExecutionContext<Context>) => {
    await iterate(nodes, async (node1, node2) => {
      await messageLengthTest(t, node1, node2)
    })
  }
)

export async function messageLengthTest(t, node1, node2) {
  //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>

  await deleteMessages(t, node2)
  console.log(`${node1.alias} and ${node2.alias}`)

  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'n1 should add n2 as contact')

  const date = new Date(Date.now())
  const limit = 2
  const offset = 0
  await sleep(2000)
  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  await sendMessage(t, node1, node2, text)
  await sleep(1000)
  const text2 = randomText()
  await sendMessage(t, node1, node2, text2)
  await sleep(1000)
  const text3 = randomText()
  await sendMessage(t, node1, node2, text3)
  await sleep(1000)
  const text4 = randomText()
  await sendMessage(t, node1, node2, text4)
  //t.true(messageSent.success, 'node1 should send text message to node2')

  const newMessagesResponse = await getCheckMsgs(
    t,
    node2,
    date,
    limit,
    offset,
    'desc'
  )
  t.true(
    newMessagesResponse.new_messages_total == 4,
    'node2 should have 4 new message'
  )
  t.true(
    decrypt(newMessagesResponse.new_messages[0], node2) == text4,
    'first message should be the newest message'
  )
  t.true(
    decrypt(newMessagesResponse.new_messages[1], node2) == text3,
    'first message should be the newest message'
  )

  const newMessagesResponse2 = await getCheckAllMessages(
    t,
    node2,
    limit,
    offset,
    'desc'
  )
  t.true(
    newMessagesResponse2.new_messages_total == 4,
    `node2 should have 4 new messages`
  )
  t.true(
    decrypt(newMessagesResponse2.new_messages[0], node2) == text4,
    'first message should be the newest message'
  )
  t.true(
    decrypt(newMessagesResponse2.new_messages[1], node2) == text3,
    'first message should be the newest message'
  )

  //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
  const allContacts = await getContacts(t, node1)
  let deletion
  for (const contact of allContacts) {
    if (contact.public_key == node2.pubkey) {
      deletion = await deleteContact(t, node1, contact.id)
      t.true(deletion, 'contacts should be deleted')
    }
  }
}
function decrypt(message: Message, node: NodeConfig) {
  return rsa.decrypt(node.privkey, message.message_content)
}
