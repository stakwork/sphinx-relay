import test from 'ava'
import * as helpers from '../utils/helpers'
// import {
//   sendMessageAndCheckDecryption,
//   sendInvoice,
//   payInvoice,
// } from '../utils/msg'

import nodes from '../nodes'
import { keysend } from '../utils/keysend'
import { getBalance } from '../utils/get'

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

  const newFee = 10

  const channelUpdate2 = await helpers.updateChannelPolicy(t, alice, newFee)
  t.true(channelUpdate2.success, 'Channel policy is updated successfully')
  await helpers.sleep(4000)
  const getBalanceBefore = await getBalance(t, virtualNode0)

  const keysend_amount = 80
  //VirtualNode0 sent some sats to Carol
  const keysend3 = await keysend(t, virtualNode0, carol, keysend_amount)
  t.true(keysend3.success, 'Keysend payment should be successful')

  const getBalanceAfter = await getBalance(t, virtualNode0)
  const total_cost = newFee + keysend_amount

  t.true(
    getBalanceBefore - getBalanceAfter === total_cost,
    'Balance difference should be fee plus amount sent'
  )

  const getBalanceBefore2 = await getBalance(t, virtualNode0)

  const keysend_amount2 = 80
  await helpers.sleep(1000)
  //VirtualNode0 sent some sats to Bob
  const keysend4 = await keysend(t, virtualNode0, bob, keysend_amount2)
  t.true(keysend4.success, 'Keysend payment should be successful')

  const getBalanceAfter2 = await getBalance(t, virtualNode0)
  const total_cost2 = newFee + keysend_amount

  t.true(
    getBalanceBefore2 - getBalanceAfter2 === total_cost2,
    'Balance difference should be fee plus amount sent'
  )

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
  const channelUpdate3 = await helpers.updateChannelPolicy(t, alice, 0)
  t.true(channelUpdate3.success, 'Channel policy is updated successfully')
}
