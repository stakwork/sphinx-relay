import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { getCheckTribe, getTribeByUuid } from '../get'
import { NodeConfig } from '../../types'

export async function pinMsgToTribe(
  t: Assertions,
  node: NodeConfig,
  id: number,
  pin: string
) {
  //node1 creates new tribe
  let c = await http.put(
    node.external_ip + '/chat_pin/' + id,
    makeArgs(node, { pin })
  )
  //check that new tribe was created successfully
  t.true(c.success, 'edit tribe pin should be successful')

  //get new tribe by Id
  const r = await getCheckTribe(t, node, id)
  //check that the chat was found
  t.true(typeof r === 'object', 'the newly created chat should be found')
  // pin updated on relay
  t.true(r.pin === pin, 'chat pin does not equal')

  const tribe = await getTribeByUuid(t, r)
  // pin updated on tribes server
  t.true(tribe.pin === pin, 'pin does not equal')

  return tribe.pin
}
