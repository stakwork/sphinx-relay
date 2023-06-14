import test from 'ava'
import * as helpers from '../utils/helpers'
// import {
//   sendMessageAndCheckDecryption,
//   sendInvoice,
//   payInvoice,
// } from '../utils/msg'

import nodes from '../nodes'
import { keysend } from '../utils/keysend'

/*
  npx ava src/tests/controllers/fees.test.ts --verbose --serial --timeout=2m
*/

test('Fees: update channel policy, make keysend payment, check balance', async (t) => {
  await testFees(t, 0, 1, 2, 3, 4)
})

export async function testFees(t, index1, index2, index3, index4, index5) {
  let alice = nodes[index1]
  let bob = nodes[index2]
  let carol = nodes[index3]
  //   let dave = nodes[index4]
  let virtualNode0 = nodes[index5]

  //Update Alice Channel Policy
  const channelUpdate = await helpers.updateChannelPolicy(t, alice, 100)
  t.true(channelUpdate.success, 'Channel policy is updated successfully')

  await helpers.sleep(1000)
  //VirtualNode0 tries to send some sats to bob
  const keysend1 = await keysend(t, virtualNode0, bob, 3)
  t.false(keysend1.success, 'Keysend should fail because fee is too high')

  //VirtualNode0 tries to send some sats to carol
  await helpers.sleep(1000)
  const keysend2 = await keysend(t, virtualNode0, carol, 200)
  t.false(keysend2.success, 'Keysend should fail because fee is too high')

  //Update Alice Channel Policy
  const channelUpdate2 = await helpers.updateChannelPolicy(t, alice, 0)
  t.true(channelUpdate2.success, 'Channel policy is updated successfully')
}
