import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'
import { Assertions } from 'ava'
import * as http from 'ava-http'
import { Chat } from '../../types'

export async function getTribeIdFromUUID(
  t: Assertions,
  node: NodeConfig,
  tribe: Chat
) {
  //GET TRIBE ID FROM PERSPECTIVE OF NODE ===>

  //get list of contacts as node
  let con = await http.get(node.ip + '/contacts', makeArgs(node))
  //get test tribe id as node
  let findTribe = con.response.chats.find((chat) => chat.uuid === tribe.uuid)
  t.true(typeof findTribe === 'object', 'tribe object should exist')
  let tribeId = findTribe.id
  t.true(typeof tribeId === 'number', 'there should be a tribe id')

  return tribeId
}
