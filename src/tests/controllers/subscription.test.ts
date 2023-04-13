import test from 'ava'
import nodes from '../nodes'
import * as http from 'ava-http'
import { makeArgs } from '../utils/helpers'
import { createTribe } from '../utils/save'

/*
npx ava src/tests/controllers/subscription.test.ts --verbose --serial --timeout=2m
*/

test('test subscription: join tribe, create subscription, update subscription', async (t) => {
  await subscription(t, 4)
})

export async function subscription(t, index) {
  const node = nodes[index]
  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node)
  t.truthy(tribe, 'tribe should have been created by node1')

  let body = { chat_id: tribe.id, interval: 'daily' }
  let newSubscription = await http.post(
    node.external_ip + '/subscriptions',
    makeArgs(node, body)
  )

  t.true(newSubscription.success, 'subscription should be successful')

  let updateBody = { chat_id: tribe.id, interval: 'weekly' }
  let updateSubscription = await http.put(
    `${node.external_ip}/subscription/${newSubscription.response.id}`,
    makeArgs(node, updateBody)
  )

  t.true(
    updateSubscription.success,
    'subscription should be updated successfuly'
  )
}
