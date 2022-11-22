import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export function getCheckBotMsg(t, node, botAlias) {
  return new Promise((resolve, reject) => {
    let i = 0
    const interval = setInterval(async () => {
      i++
      const msgRes = await http.get(
        node.external_ip + '/messages',
        makeArgs(node)
      )
      if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
        if (
          msgRes.response.new_messages[msgRes.response.new_messages.length - 1]
            .sender_alias === botAlias
        ) {
          const lastMessage =
            msgRes.response.new_messages[
              msgRes.response.new_messages.length - 1
            ]
          if (lastMessage) {
            clearInterval(interval)
            resolve(lastMessage)
          }
        }
      }
      if (i > 20) {
        clearInterval(interval)
        reject(['failed to getCheckBotMsgs'])
      }
    }, 1000)
  })
}
