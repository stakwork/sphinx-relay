import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { deleteTribe } from '../utils/del'
import { createTribe } from '../utils/save'
import { sendTribeMessage } from '../utils/msg'
import { NodeConfig } from '../types'
import * as http from 'ava-http'
import { makeArgs } from '../utils/helpers'

/*
    npx ava src/tests/controllers/tribeMember.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribeMember', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await tribeMemberTest(t, nodes[0], nodes[1])
})

async function tribeMemberTest(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')
  console.log('tribe created')
  let body = { ...man, chat_id: tribe.id }
  // const body = {
  //   chat_id: tribe.id,
  //   pub_key: node2.pubkey,
  //   photo_url: '',
  //   route_hint: node2.routeHint || '',
  //   alias: node2.alias,
  //   contact_key: node2.contact_key,
  // }
  //node1 creates new tribe
  let member = await http.post(
    node1.external_ip + '/tribe_member',
    makeArgs(node1, body)
  )
  console.log('member', member)
  //check that new tribe was created successfully
  t.true(member.success, 'member should be successful')

  await sendTribeMessage(t, node1, tribe, 'hello')
  console.log('msg sent')

  //NODE1 DELETES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}

const man = {
  pub_key: '02b98a7fb8cc007048625b6446ad49a1b3a722df8c1ca975b87160023e14d19097',
  photo_url: '',
  route_hint: '',
  alias: 'cache',
  contact_key:
    'MIIBCgKCAQEAwjAo9bayiHCLnKjsaUOtMf3RigRPsOdipoV76LTAgfcS8gHxaBizVtSfK7lMZSqjqYgm+4/f1IjYFHNGemeGLoPPcmaZGAk5F/3lIuiZuT1lyRv0by/J3B+cjmvH7DLPPhh4fK+GagNbBxQmSjwCLNyXZWp515NSG7OW0+PtFmBlZROB+EBvyEz8DFeWoBYNJG3PbVBL1/BkRjrL/J2NYAFGvqvmDeYXqpd2ot0zzSRTzZsS3fZceu7hopPM55zG3YffOUpMBDjR7Y+bZLFWqamSV13dwa/eTXZlvD2Fs5qszOOyPAv2jEfjYM3e9sR+m4qLLHqAVoWx8jDmqf1OdQIDAQAB',
}
