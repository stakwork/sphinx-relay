import http = require('ava-http')
import { makeArgs } from '../utils/helpers'
import { NodeConfig } from '../types/index'

export async function keysend(
  t,
  node: NodeConfig,
  node2: NodeConfig,
  amt: number
) {
  const v = {
    destination_key: node2.pubkey,
    route_hint: node2.routeHint,
    amount: amt,
  }
  try {
    const r = await http.post(node.external_ip + '/payment', makeArgs(node, v))

    t.true(r.success, 'Keysend should be successful')

    return r
  } catch (error) {
    return error.error
  }
}
