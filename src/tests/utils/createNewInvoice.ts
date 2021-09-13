import http = require('ava-http')
import { Assertions } from 'ava'
import { NodeConfig } from '../types'
import { makeArgs } from './helpers'

export const createNewInvoice = async (
  t: Assertions,
  receivingNode: NodeConfig,
  amount: number
): Promise<{ invoice: string }> => {
  const r = await http.post(
    receivingNode.external_ip + '/invoices',
    makeArgs(receivingNode, {
      amount,
    })
  )
  t.true(r.success, 'invoice should have been posted')
  t.truthy(
    r.response.invoice,
    'payment_request should have been included in response'
  )

  return r.response
}
