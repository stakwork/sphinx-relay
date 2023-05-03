import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function getInvoice(t, node1, payment_request) {
  //post payment from node1 to node2
  const r = await http.get(
    `${node1.external_ip}/invoice?payment_request=${payment_request}`,
    makeArgs(node1)
  )
  t.true(r.success, 'invoice should exist')

  return r
}
