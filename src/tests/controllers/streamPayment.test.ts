import test from 'ava'
import { randomText } from '../utils/helpers'
import { deleteContact } from '../utils/del'
import { getContacts } from '../utils/get'
import { addContact } from '../utils/save'
import { sendMessageAndCheckDecryption, payStream } from '../utils/msg'
import nodes from '../nodes'

/*
npx ava test-20-streamPayment.js --verbose --serial --timeout=2m
*/

test('test-20-streamPayment: establish chat, node1 streams payment, node1 streams split payment, delete contacts', async (t) => {
  await streamPayment(t, nodes[0], nodes[1], nodes[2])
})

async function streamPayment(t, node1, node2, node3) {
  //TWO NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>

  t.truthy(node3, 'this test requires three nodes')

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'node1 should add node2 as contact')

  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  await sendMessageAndCheckDecryption(t, node1, node2, text)

  //STREAM PAYMENT FROM NODE1 TO NODE2
  const stream1 = await payStream(t, node1, node2, null, 14)
  t.true(stream1)

  //STREAM SPLIT PAYMENT FROM NODE1 TO NODE2 AND NODE3 (50% SPLIT)
  const stream2 = await payStream(t, node1, node2, node3, 14)
  t.true(stream2)

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
