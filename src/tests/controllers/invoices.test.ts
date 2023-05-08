import test from 'ava'
import { createInvoice, getInvoice, payInvoice } from '../utils/invoices'
import nodes from '../nodes'
import * as helpers from '../utils/helpers'

/*
  npx ava src/tests/controllers/invoices.test.ts --verbose --serial --timeout=2m
*/

test('test invoices: create invoice, get invoice details, pay invoice, check invoice payment status', async (t) => {
  await invoices(t, 0, 1)
})

async function invoices(t, index1, index2) {
  let node1 = nodes[index1]
  let node2 = nodes[index2]

  console.log(`Checking invoices for ${node1.alias} and ${node2.alias}`)

  //Create an Invoice
  const createdInvoice = await createInvoice(t, node1, 12, 'test invoice')
  const paymentRequest = createdInvoice.response.invoice
  t.truthy(paymentRequest, 'Payment request should have been created')

  //Get Invoice details
  const invoiceDetail = await getInvoice(t, node1, paymentRequest)
  const invoicePaymentRequest = invoiceDetail.response.payment_request
  t.truthy(invoicePaymentRequest, 'Payment request should exist')

  //Payment request gotten from getInvoice should equal payment request from create invoice
  t.true(
    paymentRequest === invoicePaymentRequest,
    'Payment request gotten from getInvoice should equal payment request from create invoice'
  )

  //Node2 pays the invoice
  const paidInvoice = await payInvoice(t, node2, paymentRequest)
  t.true(paidInvoice.success, 'Invoice should have been paid')

  await helpers.sleep(1000)

  //Get Invoice details again to confirm invoice was paid
  const invoiceDetail2 = await getInvoice(t, node1, paymentRequest)
  const invoicePaymentStatus = invoiceDetail2.response.settled
  t.true(invoicePaymentStatus, 'Payment should have been made')
}
