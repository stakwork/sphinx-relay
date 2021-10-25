import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { NodeConfig } from '../../types'
import { Assertions } from 'ava'
import { Chat } from '../../types'

export async function getChats(
  t: Assertions,
  node1: NodeConfig
): Promise<Chat[]> {
  //get list of contacts from node1 perspective
  const res = await http.get(node1.external_ip + '/contacts', makeArgs(node1))
  t.truthy(res.response.chats)
  return res.response.chats
}
