import { ActionHistoryRecord } from '../models'
import constants from '../constants'

export function parseActionHistory(actions: ActionHistoryRecord[]) {
  const actionTypes = Object.keys(constants.action_types)
  const parsedActions: { [k: string]: { type: string; meta_data: any }[] } = {}
  actionTypes.forEach((action) => {
    parsedActions[action] = []
  })
  actions.reverse().forEach((action) => {
    parsedActions[actionTypes[action.actionType]].push({
      type: actionTypes[action.actionType],
      meta_data: JSON.parse(action.metaData),
    })
  })
  return parsedActions
}
