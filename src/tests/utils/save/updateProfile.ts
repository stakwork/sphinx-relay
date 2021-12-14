import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { getSelf } from '../get'

export async function updateProfile(t, node, profileUpdate) {
  //NODE UPDATES ITS PROFILE

  const self = await getSelf(t, node)
  t.truthy(self, 'own contact should be fetched')
  const nodeId = self.id
  t.truthy(nodeId, 'node should have found id for itself')

  const add = await http.put(
    node.external_ip + `/contacts/${nodeId}`,
    makeArgs(node, profileUpdate)
  )
  t.truthy(add, 'node should have updated its profile')

  return true
}
