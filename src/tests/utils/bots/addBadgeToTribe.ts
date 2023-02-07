import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function addTribeToBadge(
  t,
  node1,
  tribe,
  reward_type,
  reward_requirement
) {
  const v = {
    chat_id: tribe.id,
    reward_type,
    reward_requirement,
    badge_id: 22222222222222222222222222,
  }
  const r = await http.post(
    node1.external_ip + '/add_badge',
    makeArgs(node1, v)
  )

  t.true(r.success, 'Badge was added to tribe')
  return r
}
