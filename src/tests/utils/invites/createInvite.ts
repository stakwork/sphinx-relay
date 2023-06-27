import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'

export async function createInvite(t, node1) {
  //create invite object
  try {
    const v = {
      nickname: 'new user',
      welcome_message: 'welcome to sphinx',
    }

    //post invite
    const r = await http.post(
      node1.external_ip + '/invites',
      makeArgs(node1, v)
    )
    t.true(r.success, 'invites should have been created')

    return r
  } catch (error) {
    return error.error
  }
}
