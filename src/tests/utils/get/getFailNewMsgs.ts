import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export function getFailNewMsgs(t, node, msgUuid) {
  return new Promise((resolve, reject) => {
    let i = 0
    const interval = setInterval(async () => {
      i++
      const msgRes = await http.get(
        node.external_ip + '/messages',
        makeArgs(node)
      )
      if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
        const lastMessage = msgRes.response.new_messages.find(
          (msg) => msg.uuid === msgUuid
        )
        if (lastMessage) {
          clearInterval(interval)
          reject('message exists (but should not)')
        }
      }
      if (i > 5) {
        clearInterval(interval)
        resolve(true)
      }
    }, 1000)
  })
}
