import test, { ExecutionContext } from 'ava'
import { randomText, iterate } from '../utils/helpers'
import { addContact } from '../utils/save'
import { sendMessageAndCheckDecryption, sendPayment } from '../utils/msg'
import { deleteContact } from '../utils/del'
import { getContacts } from '../utils/get'
import nodes from '../nodes'

/*
 npx ava src/tests/controllers/chatPayment.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'test-08-chatPayment: add contact, send payments, delete contact',
  async (t: ExecutionContext<Context>) => {
    t.true(Array.isArray(nodes))
    await iterate(nodes, async (node1, node2) => {
      await chatPayment(t, node1, node2)
    })
  }
)

async function chatPayment(t, node1, node2) {
  //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>

  console.log(`${node1.alias} and ${node2.alias}`)

  console.log(`-- adding contacts ${node1.alias} to ${node2.alias}`)
  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'n1 should add n2 as contact')

  console.log(
    `-- sending message and checking decryption ${node1.alias} to ${node2.alias}`
  )
  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  await sendMessageAndCheckDecryption(t, node1, node2, text)

  console.log(
    `-- sending message and checking decryption ${node2.alias} to ${node1.alias}`
  )
  //NODE2 SENDS A TEXT MESSAGE TO NODE1
  const text2 = randomText()
  await sendMessageAndCheckDecryption(t, node2, node1, text2)

  //NODE1 SENDS PAYMENT TO NODE2
  const amount = 101
  const paymentText = 'this eleven payment'
  const payment = await sendPayment(t, node1, node2, amount, paymentText)
  t.true(payment, 'payment should be sent')

  //NODE2 SENDS PAYMENT TO NODE1
  const amount2 = 102
  const paymentText2 = 'that twelve payment'
  const payment2 = await sendPayment(t, node2, node1, amount2, paymentText2)
  t.true(payment2, 'payment should be sent')

  //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
  //  let deletion = await deleteContact(t, node1, node2)
  //t.true(deletion, 'contacts should be deleted')

  console.log('-- deleting contacts')
  const allContacts = await getContacts(t, node1)
  let deletion
  for (const contact of allContacts) {
    if (contact.public_key == node2.pubkey) {
      deletion = await deleteContact(t, node1, contact.id)
      t.true(deletion, 'contacts should be deleted')
    }
  }
}

module.exports = chatPayment
