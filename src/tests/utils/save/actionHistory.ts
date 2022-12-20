import * as http from 'ava-http'
import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'

export const saveActionHistory = async (
  t,
  search: string,
  node: NodeConfig
): Promise<boolean> => {
  const body = {
    type: 1,
    meta_data: {
      frequency: 1,
      search_term: search,
      current_timestamp: Math.floor(Date.now() / 1000),
    },
  }
  const action = await http.post(
    node.external_ip + '/action_history',
    makeArgs(node, body)
  )
  t.true(action.success, 'Action History saved successfully')
  return true
}
