import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { addContact } from '../utils/save'
import { getContacts } from '../utils/get'
import { deleteContact } from '../utils/del/deleteContact'
import { randomText } from '../utils/helpers'
import { sendMessage } from '../utils/msg'

/*
    npx ava src/tests/controllers/contacts.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('checkContacts', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))

  // NODE1 ADDS NODE2 AS A CONTACT
  // contact_key should be populated via key exchange in a few seconds
  let added = await addContact(t, nodes[0], nodes[1])
  t.true(added, 'node1 should add node2 as contact')

  const text = randomText()
  let messageSent = await sendMessage(t, nodes[0], nodes[1], text)
  t.truthy(messageSent, 'node1 should send text message to node2')
})

test.after.always('cleanup contacts', async (t: ExecutionContext<Context>) => {
  const all = await getContacts(t, nodes[0], nodes[1])
  for (const contact of all) {
    if (contact.public_key !== nodes[0].pubkey) {
      const ok = await deleteContact(t, nodes[0], contact.id)
      t.true(ok)
    }
  }
})
