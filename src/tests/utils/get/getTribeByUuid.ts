import * as http from 'ava-http'

import { config } from '../../config'

export async function getTribeByUuid(t, tribe) {
  //GET TRIBE FROM TRIBES SERVER BY UUID

  const res = await http.get(
    'http://' + config.tribeHost + `/tribes/${tribe.uuid}`
  )
  t.truthy(res, 'should get tribe by UUID from tribe host server')

  return res
}
