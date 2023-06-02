import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Message, NodeConfig } from '../../types'
import { Assertions } from 'ava'

export function getCheckMsgs(
  _t: Assertions,
  node: NodeConfig,
  date: Date,
  limit: number,
  offset: number,
  order: string = 'asc'
): Promise<{ new_messages: Array<Message>; new_messages_total: number }> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, node, date, limit, offset, order, resolve, reject)
    }, 1000)
  })
}

async function timeout(
  i: number,
  node: NodeConfig,
  date: Date,
  limit: number,
  offset: number,
  order: string,
  resolve,
  reject
) {
  const msgRes = await http.get(
    `${node.external_ip}/msgs?date=${date
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '')}&limit=${limit}&offset=${offset}&order=${order}`,
    makeArgs(node)
  )
  if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
    // console.log('===>', msgRes.response.new_messages )
    return resolve(msgRes.response)
  }
  if (i > 10) {
    return reject('failed to getCheckMsgs')
  }
  setTimeout(async () => {
    timeout(i + 1, node, date, limit, offset, order, resolve, reject)
  }, 1000)
}
