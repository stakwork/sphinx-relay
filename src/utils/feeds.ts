import { ActionHistoryRecord } from '../models'
import constants from '../constants'

export function parseActionHistory(actions: ActionHistoryRecord[]) {
  const actionTypes = Object.keys(constants.action_types)

  const parsedActions: { [k: string]: { type: string; meta_data: any }[] } = {}
  actionTypes.forEach((action) => {
    parsedActions[action] = []
  })
  actions.forEach((action) => {
    if (
      typeof JSON.parse(action.metaData) === 'object' &&
      typeof action.actionType === 'number'
    ) {
      if (action.actionType === 0) {
        const meta_data = JSON.parse(action.metaData)

        parsedActions[actionTypes[action.actionType]].push({
          type: actionTypes[action.actionType],
          meta_data: {
            topics: meta_data.keywords,
            current_timestamp: meta_data.current_timestamp,
          },
        })
      } else if (action.actionType === 2) {
        const newMetaObject = { ...JSON.parse(action.metaData) }
        if (!newMetaObject.topics) {
          newMetaObject.topics = []
        }
        if (!newMetaObject.current_timestamp) {
          newMetaObject.current_timestamp = newMetaObject.date
            ? newMetaObject.date
            : 0
        }
        parsedActions[actionTypes[action.actionType]].push({
          type: actionTypes[action.actionType],
          meta_data: { ...newMetaObject },
        })
      } else {
        parsedActions[actionTypes[action.actionType]].push({
          type: actionTypes[action.actionType],
          meta_data: JSON.parse(action.metaData),
        })
      }
    }
  })
  return parsedActions
}
