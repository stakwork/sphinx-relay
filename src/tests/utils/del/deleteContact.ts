import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function deleteContact(
  t: Assertions,
  node: NodeConfig,
  contactID: number
): Promise<boolean> {
  const deletion = await http.del(
    node.external_ip + '/contacts/' + contactID,
    makeArgs(node)
  )
  t.true(deletion.success, 'node should delete the contact')
  return true
}
