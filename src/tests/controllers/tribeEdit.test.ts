import test, { ExecutionContext } from 'ava'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe, editTribe } from '../utils/save'
import { iterate } from '../utils/helpers'
import { getTribeId, getChats, getTribeByUuid } from '../utils/get'
import nodes from '../nodes'

/*
npx ava test-15-tribeEdit.js --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('tribeEdit', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await iterate(nodes, async (node1, node2) => {
    await tribeEdit(t, node1, node2)
  })
})

async function tribeEdit(t, node1, node2) {
  //A NODE MAKES EDITS TO A TRIBE IT CREATED ===>

  console.log(`${node1.alias} and ${node2.alias}`)

  //NODE1 CREATES A TRIBE
  console.log('create tribe')
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  console.log('join tribe')
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //GET TRIBE ID FROM NODE1 PERSPECTIVE
  console.log('get id')
  const tribeId = await getTribeId(t, node1, tribe)
  t.true(typeof tribeId === 'number')

  //CREATE TRIBE BODY WITH EDITED PRICE_TO_JOIN
  const newPriceToJoin = 12
  const newDescription = 'Edited Description'
  const body = {
    name: tribe.name || 0,
    price_per_message: tribe.price_per_message || 0,
    price_to_join: newPriceToJoin,
    escrow_amount: tribe.escrow_amount || 0,
    escrow_millis: tribe.escrow_millis || 0,
    img: tribe.img || '',
    description: newDescription,
    tags: [],
    unlisted: true,
    app_url: '',
    feed_url: '',
  }

  //USE TRIBE ID AND EDITED BODY TO EDIT THE TRIBE
  console.log('edit tribe')
  const edit = await editTribe(t, node1, tribeId, body)
  t.true(edit.success, 'edit should have succeeded')
  t.true(
    edit.tribe.price_to_join === newPriceToJoin,
    'new price to join should be included in edit'
  )

  //GET ALL CHATS FROM NODE1 PERSPECTIVE
  console.log('get chats')
  const node1Chats = await getChats(t, node1)
  const editedTribe = await node1Chats.find((c) => c.id === tribeId)
  t.truthy(editedTribe, 'tribe should be listed in node1 chats')
  t.true(
    editedTribe?.price_to_join === newPriceToJoin,
    'fetched chat should show edit'
  )

  //FETCH TRIBE FROM TRIBE SERVER TO CHECK EDITS
  console.log('fetch tribe')
  const tribeFetch = await getTribeByUuid(t, tribe)
  t.true(typeof tribeFetch === 'object', 'fetched tribe object should exist')
  t.true(
    tribeFetch.price_to_join === newPriceToJoin,
    'tribe server should show new price'
  )
  t.true(
    tribeFetch.description === newDescription,
    'tribe server should show new description'
  )

  //NODE2 LEAVES THE TRIBE
  console.log('leave tribe')
  let left = await leaveTribe(t, node2, tribe)
  t.true(left, 'node2 should leave tribe')

  //NODE1 DELETES THE TRIBE
  console.log('delete tribe')
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
