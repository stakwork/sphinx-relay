import { Assertions } from 'ava'

export const getMessageDiff = async (t: Assertions, noCacheMsg, cacheMsg) => {
  const missingField: string[] = ['created_at', 'updated_at']
  if (cacheMsg.cached && noCacheMsg.cached === undefined) {
    for (let key in noCacheMsg) {
      if (key !== 'chat') {
        // created_at and updated_at are always null
        if (cacheMsg[key] === undefined) {
          missingField.push(key)
        }
      }
    }
    return missingField
  } else {
    return false
  }
}
