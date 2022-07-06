import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { leaveTribe, deleteTribe } from '../utils/del'
import { createTribe, joinTribe, updateProfile } from '../utils/save'
import { randomText, iterate } from '../utils/helpers'
import { NodeConfig } from '../types'
import { sendTribeMessageAndCheckDecryption } from '../utils/msg'
import { getCheckNewMsgs, getSelf } from "../utils/get";

/*
    npx ava src/tests/controllers/tribe.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribe', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await iterate(nodes, async (node1, node2) => {
    await tribeTest(t, node1, node2)
  })
})

async function tribeTest(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text = randomText()
  let tribeMessage = await sendTribeMessageAndCheckDecryption(
    t,
    node1,
    node2,
    text,
    tribe
  )
  t.true(!!tribeMessage, 'node1 should send message to tribe')

  //NODE2 SENDS A TEXT MESSAGE IN TRIBE
  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
    t,
    node2,
    node1,
    text2,
    tribe
  )
  t.true(!!tribeMessage2, 'node1 should send message to tribe')

  //NODE2 LEAVES THE TRIBE
  let left = await leaveTribe(t, node2, tribe)
  t.true(left, 'node2 should leave tribe')

  //NODE2 LEAVES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}

test.serial('Tribe test for seeing that if 2 nodes have the same alias, the sender alias is changed',async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await tribeUniqueAliasTest(t,nodes[0],nodes[1], nodes[2])
})

// Tests that if 2 nodes with the same alias join a tribe, their alias assigned in the tribes is different
async function tribeUniqueAliasTest(
    t: ExecutionContext<Context>,
    node1: NodeConfig,
    node2: NodeConfig,
    node3: NodeConfig
) {
  //NODE1 creates a tribe
  let tribe = await createTribe(t, node1);
  t.truthy(tribe, 'tribe should have been created by node1')

  //Set the alias of NODE2 to be the same as NODE1
  let old_alias = node2.alias;
  let newAlias = {alias: node1.alias};
  const change = await updateProfile(t, node2, newAlias);
  t.true(change,'node2 should have updated its profile')
  const newNode2 = await getSelf(t, node2);
  t.true(newNode2.alias !== old_alias, 'node2 alias should not be equal to old alias')
  t.true(newNode2.alias === node1.alias, 'node2 alias should be equal node1 alias')


  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2,'node3 should join tribe')

  //First node1 sends a message in tribe
  let text = randomText()
  let tribeMessage = await sendTribeMessageAndCheckDecryption(
      t,
      node1,
      node3,
      text,
      tribe
  )
  t.true(!!tribeMessage, 'node1 should send message to tribe')

  //Then node2 sends a message in tribe
  let text2 = randomText()
  let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
      t,
      node2,
      node3,
      text2,
      tribe
  )
  t.true(!!tribeMessage2, 'node2 should send message to tribe')
  let message1 = await getCheckNewMsgs(t,node3,tribeMessage.uuid)
  let message2 = await getCheckNewMsgs(t,node3, tribeMessage2.uuid)
  t.true(message1.sender_alias!== message2.sender_alias, "The sender alias in both messages should be different")
  //Check that our logic for assigning an alternate alias is working
  t.true(message2.sender_alias === `${node1.alias}_2`, "The sender alias should be modified according to our unique alias logic")

  //NODE3 LEAVES THE TRIBE
  let left1 = await leaveTribe(t, node3, tribe)
  t.true(left1, 'node3 should leave tribe')

  //NODE2 LEAVES THE TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE1 LEAVES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')

}
