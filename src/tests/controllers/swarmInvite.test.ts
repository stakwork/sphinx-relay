import test from 'ava'
import { createInvite, payInvite, getInvite } from '../utils/invites'
import nodes from '../nodes'
import { sleep } from '../utils/helpers'

/*
npx ava src/tests/controllers/swarmInvite.test.ts --verbose --serial --timeout=2m
*/

test('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await swarmInvite(t, 3, 4, 5)
})

export async function swarmInvite(t, index1, index2, index3) {
  //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]

  console.log(
    `Checking swarm invite for ${node1.alias} and ${node2.alias} and ${node3.alias}`
  )

  // Create Invite
  const invite = await createInvite(t, node2)
  t.true(invite.success, 'Invite should be created')

  const paidInvite = await payInvite(
    t,
    node2,
    invite.contact.invite.invite_string
  )
  t.true(paidInvite.success, 'Invite should have been paid for')

  await sleep(70000)
  const finishedInvite = await getInvite(
    t,
    node2,
    paidInvite.response.invite.invite_string
  )
  t.truthy(
    finishedInvite.response.invite.connection_string,
    'Connection string should exist'
  )
}
