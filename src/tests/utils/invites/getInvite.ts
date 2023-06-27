import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function getInvite(t, node1, invite_string) {
  try {
    //get invite details
    const r = await http.get(
      `${node1.external_ip}/invites/${invite_string}`,
      makeArgs(node1)
    )
    t.true(r.success, 'invoice should exist')

    return r
  } catch (error) {
    return error.error
  }
}
