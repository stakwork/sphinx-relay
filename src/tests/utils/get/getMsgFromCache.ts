import * as http from 'ava-http'
// import { makeArgs } from '../helpers'
// import { NodeConfig } from '../../types'
import { Assertions } from 'ava'

export async function getCacheMsg(
  t: Assertions,
  tribe,
  message,
  content
): Promise<boolean> {
  const msgRes = await http.get(`http://localhost:8008/api/msgs/${tribe.uuid}`)

  if (msgRes.length > 0) {
    for (let i = 0; i < msgRes.length; i++) {
      const msg = msgRes[i]
      if (msg.uuid === message.uuid && msg.message_content === content) {
        return true
      }
    }
    return false
  } else {
    return false
  }
}
