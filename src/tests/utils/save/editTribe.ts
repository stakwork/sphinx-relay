import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function editTribe(t, node, tribeId, body) {
  //NODE EDIT THE TRIBE ===>
  console.log('inside edit')
  console.log('body === ', body)
  try {
    const res = await http.put(
      node.external_ip + `/group/${tribeId}`,
      makeArgs(node, body)
    )
    t.true(res.success, 'node should have edited tribe')
    return { success: res.success, tribe: res.response }
  } catch (e) {
    console.log('error')
  }
  return { success: false }
}
