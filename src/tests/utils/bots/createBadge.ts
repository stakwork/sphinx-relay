import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function createBadge(t, node1, tribe) {
  const v = {
    icon: 'test-asset-icon',
    name: 'test badge',
    amount: 10,
    chat_id: tribe.id,
    claim_amount: 10,
    reward_type: 1,
  }
  const r = await http.post(
    node1.external_ip + '/create_badge',
    makeArgs(node1, v)
  )

  t.true(r.success, 'Badge bot created.')

  return r
}
