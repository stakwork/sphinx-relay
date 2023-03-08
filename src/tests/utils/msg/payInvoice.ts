import { Assertions } from 'ava'
import http = require('ava-http')
import { NodeConfig } from '../../types'
import { getCheckNewPaidInvoice, getBalance } from '../get'
import { makeArgs } from '../helpers'

export const payInvoice = async (
  t: Assertions,
  sendingNode: NodeConfig,
  receivingNode: NodeConfig,
  amount: number,
  payment_request: string
): Promise<boolean> => {
  //PAY INVOICE FROM NODE1 TO NODE2 ===>

  //get sendingNode balance before payment
  const sendingNodebeforeBalance = await getBalance(t, sendingNode)
  //get receivingNode balance before payment
  const receivingNodebeforeBalance = await getBalance(t, receivingNode)

  const v = { payment_request }
  const r = await http.put(
    sendingNode.external_ip + '/invoices',
    makeArgs(sendingNode, v)
  )

  console.log('-> payInvoice res', sendingNode.alias, r)
  t.true(r.success, 'Put method should have succeeded')
  const paymentHash = r.response.payment_hash
  t.truthy(paymentHash, 'paymentHash should exist')

  //wait for PUT method
  const paid = await getCheckNewPaidInvoice(t, receivingNode, paymentHash)
  t.truthy(paid, 'receivingNode should see payment')

  //get sendingNode balance after payment
  const sendingNodeafterBalance = await getBalance(t, sendingNode)
  //get receivingNode balance after payment
  const receivingNodeafterBalance = await getBalance(t, receivingNode)

  console.log('amount', amount)
  console.log('NODE1 === ', sendingNodebeforeBalance - sendingNodeafterBalance)
  console.log(
    'NODE2 === ',
    receivingNodeafterBalance - receivingNodebeforeBalance
  )

  //check that sendingNode sent payment and receivingNode received payment based on balances
  //3 SAT ARE ADDED AS A MESSAGE FEE
  t.true(
    sendingNodebeforeBalance - sendingNodeafterBalance >= amount,
    'sendingNode should have paid amount'
  )
  t.true(
    receivingNodebeforeBalance - receivingNodeafterBalance <= amount - 3,
    'receivingNode should have received amount'
  )

  return true
}
