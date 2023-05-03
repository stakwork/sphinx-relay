import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function createInvoice(t, node1, amount, text) {
  //create payment object
  const v = {
    contact_id: null,
    chat_id: null,
    amount: amount,
    text,
  }

  //post payment from node1 to node2
  const r = await http.post(node1.external_ip + '/invoices', makeArgs(node1, v))
  t.true(r.success, 'invoice should have been posted')

  return r
}
