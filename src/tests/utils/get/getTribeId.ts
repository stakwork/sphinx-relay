import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function getTribeId(t, node, tribe) {
  //GET TRIBE ID FROM PERSPECTIVE OF NODE ===>

  //get list of contacts as node
  const con = await http.get(node.external_ip + '/contacts', makeArgs(node))
  //get test tribe id as node
  const findTribe = con.response.chats.find((chat) => chat.uuid === tribe.uuid)
  t.true(typeof findTribe === 'object', 'tribe object should exist')
  const tribeId = findTribe.id
  t.true(typeof tribeId === 'number', 'there should be a tribe id')

  return tribeId
}
