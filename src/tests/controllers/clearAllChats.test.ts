import test, { Assertions } from 'ava'
import { asyncForEach } from '../../helpers'
import { deleteChat } from '../utils/del'
import { getChats } from '../utils/get'
import nodes from '../nodes'

/*
npx ava test-99-clearAllChats.js --verbose --serial --timeout=2m
*/

test('test-99-clearAllChats: clear all chats from nodes', async (t) => {
  await clearAllChats(t)
})

async function clearAllChats(t: Assertions) {
  //DELETE ALL CHATS ===>

  await asyncForEach(nodes, async (node) => {
    if (!node) return

    //get all chats from node
    const chats = await getChats(t, node)
    t.truthy(chats, 'should have fetched chats')
    if (chats.length === 0) {
      console.log(`${node.alias} had no chats`)
      return
    }

    //delete any chat that node is a part of
    await asyncForEach(chats, async (c) => {
      const deletion = await deleteChat(t, node, c.id)
      t.true(deletion, 'node should delete chat')
    })

    console.log(`${node.alias} deleted all chats`)
  })

  return true
}
