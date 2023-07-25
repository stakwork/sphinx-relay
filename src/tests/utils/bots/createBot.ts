import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function createBot(t, node1, name) {
  const v = {
    name,
  }
  try {
    const r = await http.post(node1.external_ip + '/bot', makeArgs(node1, v))

    t.true(r.success, 'Bot created.')
    return r
  } catch (error) {
    return error.error
  }
}
