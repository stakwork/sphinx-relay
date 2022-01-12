import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Message, NodeConfig } from '../../types'
import { Assertions } from 'ava'

export function getCheckMsgs(
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
  const msgRes = await http.get(node.external_ip + '/msgs', makeArgs(node))
  if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
    // console.log('===>', msgRes.response.new_messages, msgUuid)
    return resolve(msgRes)
  }
  if (i > 10) {
    return reject('failed to getCheckMsgs')
  }
  setTimeout(async () => {
    timeout(i + 1, node, msgUuid, resolve, reject)
  }, 1000)
}
