import * as http from 'ava-http'
import { Message } from '../../types'

import { makeArgs } from '../helpers'

export function getCheckNewJoin(t, admin, joinerId, tribeId): Promise<Message> {
  return new Promise((resolve, reject) => {
    let i = 0
    const interval = setInterval(async () => {
      i++
      const msgRes = await http.get(
        admin.external_ip + '/messages',
        makeArgs(admin)
      )
      if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
        const lastMessage = msgRes.response.new_messages.find(
          (msg) =>
            msg.type === 19 &&
            msg.chat_id === tribeId &&
            msg.sender === joinerId
        )
        if (lastMessage) {
          clearInterval(interval)
          resolve(lastMessage)
        }
      }
      if (i > 10) {
        clearInterval(interval)
        reject(['failed to getCheckNewMsgs'])
      }
    }, 1000)
  })
}
