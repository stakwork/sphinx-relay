import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export function getCheckBotMsg(t, node, botAlias, tribe, count) {
  return new Promise((resolve, reject) => {
    let i = 0
    const interval = setInterval(async () => {
      i++
      const msgRes = await http.get(
        node.external_ip + '/messages',
        makeArgs(node)
      )
      if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
        const messages = msgRes.response.new_messages
        let msgCount = 0
        for (let i = 0; i < messages.length; i++) {
          let msg = messages[i]
          if (msg.chat.uuid === tribe.uuid && msg.sender_alias === botAlias) {
            msgCount += 1
            if (msgCount === count) {
              clearInterval(interval)
              resolve(msg)
            }
          }
        }
      }
      if (i > 10) {
        clearInterval(interval)
        reject(['failed to getCheckBotMsgs'])
      }
    }, 1000)
  })
}
