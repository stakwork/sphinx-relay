import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'
import * as http from 'ava-http'

export async function getAllMessages(node: NodeConfig) {
  const msg = await http.get(node.external_ip + '/allmessages', makeArgs(node))
  console.log(msg)
}
