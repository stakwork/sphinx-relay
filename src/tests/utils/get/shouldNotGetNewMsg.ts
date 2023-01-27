import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Message, NodeConfig } from '../../types'
import { Assertions } from 'ava'

export function shouldNotGetNewMsgs(
  _t: Assertions,
  node: NodeConfig,
  msgUuid: string
): Promise<Message> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, node, msgUuid, resolve, reject)
    }, 1000)
  })
}

async function timeout(
  i: number,
  node: NodeConfig,
  msgUuid: string,
  resolve,
  reject
) {
  const msgRes = await http.get(node.external_ip + '/messages', makeArgs(node))
  if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
    // console.log('===>', msgRes.response.new_messages, msgUuid)
    const lastMessage = msgRes.response.new_messages.find(
      (msg) => msg.uuid === msgUuid
    )
    if (lastMessage) {
      return reject('Not expected to get message with this id')
    }
  }
  if (i > 5) {
    return resolve(true)
  }
  setTimeout(async () => {
    timeout(i + 1, node, msgUuid, resolve, reject)
  }, 500)
}
