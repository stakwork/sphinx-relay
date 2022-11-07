import { ActionHistoryRecord } from '../models'
import constants from '../constants'

export function parseActionHistory(actions: ActionHistoryRecord[]) {
  const actionTypes = Object.keys(constants.action_types)
  const parsedActions: { type: string; meta_data: any }[] = []
  actions.forEach((action) => {
    parsedActions.push({
      type: actionTypes[action.actionType],
      meta_data: JSON.parse(action.metaData),
    })
  })
  return parsedActions.reverse()
}
