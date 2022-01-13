import test, { ExecutionContext } from 'ava'
import { randomText, iterate, sleep } from '../utils/helpers'
import { addContact } from '../utils/save'
import { deleteContact } from '../utils/del'
import { sendMessage } from '../utils/msg'
import { getContacts, getCheckMsgs } from '../utils/get'

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

  console.log(`${node1.alias} and ${node2.alias}`)

  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'n1 should add n2 as contact')

  const date = new Date(Date.now())
  await sleep(2000)
  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  await sendMessage(t, node1, node2, text)
  //t.true(messageSent.success, 'node1 should send text message to node2')

  const newMessages = await getCheckMsgs(t, node2, date)
  console.log(JSON.stringify(newMessages))
  t.true(
    newMessages.new_messages_total == 1,
    'node2 should only have 1 new message'
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
