import test, { ExecutionContext } from 'ava'
import { sendPayment } from '../utils/msg'
import nodes from '../nodes'
import { addContact } from '../utils/save'

/*
 npx ava src/tests/controllers/chatPayment.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'test-08-chatPayment: add contact, send payments, delete contact',
  async (t: ExecutionContext<Context>) => {
    t.true(Array.isArray(nodes))
    await ampMessage(t, nodes)
  }
)

async function ampMessage(t, nodes) {
  //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT USING AMP ===>

  console.log(`${nodes[0].alias} and ${nodes[1].alias}`)

  console.log('adding contact')
  const added = await addContact(t, nodes[0], nodes[1])
  t.true(added, 'n1 should add n2 as contact')
  console.log('contact added')

  console.log('sending payment [Alice] -> [Bob]')
  //NODE1 SENDS PAYMENT TO NODE2
  const amount = 1500000
  const paymentText = 'this eleven payment'
  const payment = await sendPayment(t, nodes[0], nodes[1], amount, paymentText)
  t.true(payment, 'payment should be sent')
  console.log(payment)
  console.log('payment sent [Alice] -> [Bob]')

  //Alice both keysend and amp enabled
  //Bob only keysend enabled
  //Carol only amp enabled

  //Test that we can send a payment with an amount larger than largest channel size
  //from Alice -> Carol and using Bob as liquidity as the second part of the amp payment
  //Alice -> 1.5mil sats -> Carol (since Alice has two channels with 1 mil each)

  //Test that if Bob doesnt have amp enabled this still works with keysend

  //Test that Bob with only keysend enabled can send to amp node (ie Carol)
}

module.exports = ampMessage
