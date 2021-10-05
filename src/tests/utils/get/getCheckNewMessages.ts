import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Message, NodeConfig } from '../../types'
import { Assertions } from 'ava'

export function getCheckNewMsgs(
  t: Assertions,
  node: NodeConfig,
  msgUuid: string
): Promise<Message> {
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
          resolve(lastMessage)
        }
      }
      if (i > 10) {
        clearInterval(interval)
        reject('failed to getCheckNewMsgs')
      }
    }, 1000)
  })
}
