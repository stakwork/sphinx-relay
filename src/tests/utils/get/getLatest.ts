import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function getLatest(t, node, timestamp) {
  //GET LATEST FROM A NODE PERSPECTIVE

  //get latest from node perspective
  const res = await http.get(
    node.external_ip + `/latest_contacts?date=${timestamp}`,
    makeArgs(node)
  )
  t.true(res.success, 'get latest should exist')

  return res
}
