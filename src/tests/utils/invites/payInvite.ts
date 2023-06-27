import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function payInvite(t, node1, invite_string) {
  try {
    //pay for invite created
    const r = await http.post(
      `${node1.external_ip}/invites/${invite_string}/pay`,
      makeArgs(node1)
    )
    t.true(r.success, 'invites invoice should have been payed')

    return r
  } catch (error) {
    return error.error
  }
}
