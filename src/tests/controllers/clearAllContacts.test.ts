import test from 'ava'
import * as http from 'ava-http'
import { makeArgs, asyncForEach } from '../utils/helpers'
import nodes from '../nodes'

/*
npx ava test-98-clearAllContacts.js --verbose --serial --timeout=2m
*/

test('test-98-clearAllContacts: clear all contacts from nodes', async (t) => {
  await clearAllContacts(t)
})

export async function clearAllContacts(t) {
  //DELETE ALL CONTACTS ===>

  await asyncForEach(nodes, async (node) => {
    if (!node) return

    //get all contacts from node
    const res = await http.get(
      node.external_ip + '/contacts?unmet=include',
      makeArgs(node)
    )
    const contacts = res.response.contacts
    t.truthy(contacts, 'should have at least one contact')

    if (contacts.length === 1) {
      console.log(`${node.alias} had no contacts`)
      return
    }

    //delete any contact basides itself
    await asyncForEach(contacts, async (c) => {
      if (c.public_key !== node.pubkey) {
        const deletion = await http.del(
          node.external_ip + '/contacts/' + c.id,
          makeArgs(node)
        )
        t.true(deletion.success, 'node should delete the contact')
      }
    })

    console.log(`${node.alias} deleted all contacts`)
  })
  return true
}
