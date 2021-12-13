import test, { ExecutionContext } from 'ava'
import { randomText, iterate } from '../utils/helpers'
import { addContact } from '../utils/save'
import { deleteContact } from '../utils/del'
import {
  sendMessageAndCheckDecryption,
  sendInvoice,
  payInvoice,
} from '../utils/msg'
import { getContacts } from '../utils/get'

import nodes from '../nodes'

/*
  npx ava src/tests/controllers/chatInvoice.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact',
  async (t: ExecutionContext<Context>) => {
    await iterate(nodes, async (node1, node2) => {
      await chatInvoice(t, node1, node2)
    })
  }
)

export async function chatInvoice(t, node1, node2) {
  //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>

  console.log(`${node1.alias} and ${node2.alias}`)

  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'n1 should add n2 as contact')

  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  await sendMessageAndCheckDecryption(t, node1, node2, text)
  // t.true(messageSent.success, 'node1 should send text message to node2')

  //NODE2 SENDS A TEXT MESSAGE TO NODE1
  const text2 = randomText()
  await sendMessageAndCheckDecryption(t, node2, node1, text2)
  //t.true(messageSent2.success, 'node2 should send text message to node1')

  //NODE1 SENDS INVOICE TO NODE2
  const amount = 11
  const paymentText = 'this invoice'
  const invoice = await sendInvoice(t, node1, node2, amount, paymentText)
  t.truthy(invoice, 'invoice should be sent')
  const payReq = invoice.response.payment_request
  t.truthy(payReq, 'payment request should exist')

  const payInvoice1 = await payInvoice(t, node2, node1, amount, payReq)
  t.true(payInvoice1, 'Node2 should have paid node1 invoice')

  //NODE2 SENDS INVOICE TO NODE1
  const amount2 = 12
  const paymentText2 = 'that invoice'
  const invoice2 = await sendInvoice(t, node2, node1, amount2, paymentText2)
  t.truthy(invoice2, 'invoice should be sent')
  const payReq2 = invoice2.response.payment_request
  t.truthy(payReq2, 'payment request should exist')

  const payInvoice2 = await payInvoice(t, node1, node2, amount2, payReq2)
  t.true(payInvoice2, 'Node1 should have paid node2 invoice')

  //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
  //  let deletion = await deleteContact(t, node1, node2)
  // t.true(deletion, 'contacts should be deleted')
  const allContacts = await getContacts(t, node1)
  let deletion
  for (const contact of allContacts) {
    if (contact.public_key == node2.pubkey) {
      deletion = await deleteContact(t, node1, contact.id)
      t.true(deletion, 'contacts should be deleted')
    }
  }
}
