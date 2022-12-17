import * as http from 'ava-http'
import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'

export const verifyActionHistorySaved = async (
  searchTerm: string,
  node: NodeConfig
): Promise<boolean> => {
  const result = await http.get(
    node.external_ip + '/action_history',
    makeArgs(node)
  )

  const actionHistories = result.response
  for (let i = 0; i < actionHistories.length; i++) {
    const action = actionHistories[i]
    if (action.actionType === 1) {
      const meta_data = JSON.parse(action.metaData)
      if (meta_data.search_term === searchTerm) {
        return true
      }
    }
  }
  return false
}
