import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function payInvoice(t, node, payment_request) {
  try {
    const v = { payment_request }
    const r = await http.put(node.external_ip + '/invoices', makeArgs(node, v))

    t.true(r.success, 'Put method should have succeeded')

    return r
  } catch (error) {
    return error.error
  }
}
