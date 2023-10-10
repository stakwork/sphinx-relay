import test from 'ava'
import { createInvoice, getInvoice, payInvoice } from '../utils/invoices'
import nodes from '../nodes'
import * as helpers from '../utils/helpers'

/*
  npx ava src/tests/controllers/invoices.test.ts --verbose --serial --timeout=2m
*/

test('test invoices: create invoice, get invoice details, pay invoice, check invoice payment status', async (t) => {
  await helpers.iterate(nodes, async (node1, node2) => {
    await await invoices(t, node1, node2)
  })
})

async function invoices(t, node1, node2) {
  console.log(`Checking invoices for ${node1.alias} and ${node2.alias}`)

  console.log(`${node1.alias} generating invoice to be paid by ${node2.alias}`)

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

  await helpers.sleep(1000)
  //Node2 pays the invoice
  const paidInvoice = await payInvoice(t, node2, paymentRequest)
  t.true(paidInvoice.success, 'Invoice should have been paid')

  await helpers.sleep(1000)

  //Get Invoice details again to confirm invoice was paid
  const invoiceDetail2 = await getInvoice(t, node1, paymentRequest)
  const invoicePaymentStatus = invoiceDetail2.response.settled
  t.true(
    invoicePaymentStatus,
    `Payment should have been made by ${node2.alias} to ${node1.alias}`
  )

  console.log(`${node2.alias} generating invoice to be paid by ${node1.alias}`)

  //Create an Invoice by node 2
  await helpers.sleep(1000)
  const createdInvoice2 = await createInvoice(t, node2, 12, 'test invoice')
  const paymentRequest2 = createdInvoice2.response.invoice
  t.truthy(paymentRequest2, 'Payment request should have been created')

  //Get Invoice details by node 2
  const invoiceDetail3 = await getInvoice(t, node2, paymentRequest2)
  const invoicePaymentRequest2 = invoiceDetail3.response.payment_request
  t.truthy(
    invoicePaymentRequest2,
    `Payment request should exist for ${node2.alias} when testing with ${node1.alias}`
  )

  //Payment request gotten from getInvoice should equal payment request from create invoice
  t.true(
    paymentRequest2 === invoicePaymentRequest2,
    'Payment request gotten from getInvoice should equal payment request from create invoice'
  )
  await helpers.sleep(1000)
  //Node2 pays the invoice
  const paidInvoice2 = await payInvoice(t, node1, paymentRequest2)
  t.true(paidInvoice2.success, 'Invoice should have been paid')

  await helpers.sleep(1000)

  //Get Invoice details again to confirm invoice was paid
  const invoiceDetail4 = await getInvoice(t, node2, paymentRequest2)
  const invoicePaymentStatus2 = invoiceDetail4.response.settled
  t.true(
    invoicePaymentStatus2,
    `Payment should have been made by ${node2.alias} to ${node1.alias}`
  )
}
