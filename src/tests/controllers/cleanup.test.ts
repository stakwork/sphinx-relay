import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { getContacts, getChats } from '../utils/get'
import { deleteContact, deleteChat } from '../utils/del'
import { asyncForEach } from '../utils/helpers'
import { NodeConfig } from '../types'

/*
  npx ava src/tests/controllers/cleanup.test.ts --verbose --serial --timeout=2m
*/
interface Context {}

test.serial('cleanup contacts', async (t: ExecutionContext<Context>) => {
  await asyncForEach(nodes, async (node1: NodeConfig) => {
    console.log('=> cleanup contacts', node1.alias)
    const allContacts = await getContacts(t, node1)
    for (const contact of allContacts) {
      if (contact.public_key !== node1.pubkey) {
        const ok = await deleteContact(t, node1, contact.id)
        t.true(ok)
      }
    }
  })
})

test.serial('cleanup chats', async (t: ExecutionContext<Context>) => {
  await asyncForEach(nodes, async (node1: NodeConfig) => {
    console.log('=> cleanup chats', node1.alias)
    const allChats = await getChats(t, node1)
    for (const chat of allChats) {
      const ok = await deleteChat(t, node1, chat.id)
      t.true(ok)
    }
  })
})
