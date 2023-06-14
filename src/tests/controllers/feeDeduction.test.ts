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
  npx ava src/tests/controllers/feeDeduction.test.ts --verbose --serial --timeout=2m
*/

test('Fees: update channel policy, make keysend payment, check balance', async (t) => {
  await testFeesDeduction(t, 0, 1, 2, 4)
})

export async function testFeesDeduction(t, index1, index2, index3, index5) {
  let alice = nodes[index1]
  let bob = nodes[index2]
  let carol = nodes[index3]
  let virtualNode0 = nodes[index5]

  const newFee = 10

  const channelUpdate2 = await helpers.updateChannelPolicy(t, alice, 10)
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
}
