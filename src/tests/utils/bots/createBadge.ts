import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function createBadge(t, node1, name) {
  const v = {
    icon: 'test-asset-icon',
    name,
    amount: 10,
    memo: 'Test Badge created',
  }
  const r = await http.post(
    node1.external_ip + '/create_badge',
    makeArgs(node1, v)
  )

  t.true(r.success, 'Badge bot created.')
  return r
}
