import test from 'ava'

import { randomText, sleep } from '../utils/helpers'
import { createTribe, joinTribe } from '../utils/save'
import { deleteMessage, deleteTribe, leaveTribe } from '../utils/del'
import {
  checkMessageDecryption,
  sendEscrowMsg,
  sendTribeMessage,
} from '../utils/msg'
import nodes from '../nodes'
import { getBalance, getCheckNewMsgs } from '../utils/get'

/*
npx ava src/tests/controllers/tribe3Escrow.test.ts --verbose --serial --timeout=2m
*/

test('test-12-tribe3Escrow: create tribe, two nodes join tribe, send messages, check escrow, delete tribe', async (t) => {
  await tribe3Escrow(t, nodes[0], nodes[1], nodes[2])
})

async function tribe3Escrow(t, node1, node2, node3) {
  //TWO NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>

  t.truthy(node3, 'this test requires three nodes')

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 CREATES A TRIBE WITH ESCROW AND PPM
  let tribe = await createTribe(t, node1, 10, 2000, 5)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE2 (non-admin) SENDS A PAID TEXT MESSAGE IN TRIBE
  const text = randomText()
  let escrowMessage = await sendEscrowMsg(t, node2, node1, tribe, text)
  t.true(
    escrowMessage.success,
    'node2 (non-admin) should send escrow message to tribe'
  )

  //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check = await checkMessageDecryption(
    t,
    node3,
    escrowMessage.message.uuid,
    text
  )
  t.true(
    n3check,
    "node3 (non-admin) should have read and decrypted node2's message"
  )

  const balBefore = await getBalance(t, node2)

  //Bob sends message in a tribe
  const text2 = randomText()
  const msg = await sendTribeMessage(t, node2, tribe, text2, {
    amount: tribe.escrow_amount + tribe.price_per_message,
  })

  //Admin tries to get sent message
  const msg2 = await getCheckNewMsgs(t, node1, msg.uuid)

  //Get Balance immediately ater a message is sent
  const balImmediatelyAfter = await getBalance(t, node2)

  //Delete Message by Admin
  await deleteMessage(t, node1, msg2.id)

  await sleep(tribe.escrow_millis + 5000)

  //Get balance after escrow time
  const balAfterEscrow = await getBalance(t, node2)

  t.true(
    balBefore - balImmediatelyAfter ===
      tribe.escrow_amount + tribe.price_per_message + 3,
    'Difference between balance before and after message should be equal to the sum of escrow and price_per_message'
  )

  t.true(
    balAfterEscrow === balImmediatelyAfter,
    'Balance after escrow should be equal to balance immediately after sending message'
  )

  //NODE2 LEAVES THE TRIBE
  let n2left = await leaveTribe(t, node2, tribe)
  t.true(n2left, 'node2 should leave tribe')

  //NODE3 LEAVES THE TRIBE
  let n3left = await leaveTribe(t, node3, tribe)
  t.true(n3left, 'node3 should leave tribe')

  //NODE1 DELETES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}

module.exports = tribe3Escrow
