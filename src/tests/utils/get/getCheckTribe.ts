import { Assertions } from 'ava'
import http = require('ava-http')
import { NodeConfig, Chat } from '../../types'
import { makeArgs } from '../helpers'

export function getCheckTribe(
  _t: Assertions,
  node: NodeConfig,
  tribeId: number
): Promise<Chat> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, node, tribeId, resolve, reject)
    }, 1000)
  })
}

async function timeout(i, node, tribeId, resolve, reject) {
  let res = await http.get(node.ip + '/contacts', makeArgs(node))
  if (res) {
    let r = res.response.chats.find((chat) => chat.id === tribeId)
    if (r) {
      return resolve(r)
    }
  }
  if (i > 10) {
    return reject(['failed to getCheckTribe'])
  }
  setTimeout(async () => {
    timeout(i + 1, node, tribeId, resolve, reject)
  }, 1000)
}
