import test from 'ava'
import { randomText, sleep, getTimestamp } from '../utils/helpers'
import { addContact } from '../utils/save'
import { getLatest, getContacts } from '../utils/get'
import { deleteContact } from '../utils/del'
import {
  sendMessageAndCheckDecryption,
  checkMessageDecryption,
} from '../utils/msg'
import { NodeConfig } from '../types'
import nodes from '../nodes'

/*
 npx ava src/tests/controllers/latestTest.test.ts --verbose --serial --timeout=2m
*/

test('test-40-latestTest: create timestamp, add contact and chat, get latest, delete contacts', async (t) => {
  await latestTest(t, nodes[0], nodes[1], nodes[2])
})

async function latestTest(t, node1, node2, node3: NodeConfig | null = null) {
  //TWO NODES SEND TEXT MESSAGES TO EACH OTHER ===>

  let aliases = `${node1.alias} and ${node2.alias}`
  if (node3) aliases = aliases + ` and ${node3?.alias}`
  console.log(aliases)

  //CREATE TIMESTAMP
  const dateq1 = getTimestamp()
  t.truthy(dateq1, 'timestamp should exist')

  await sleep(1000)

  //NODE1 GETS LATEST
  const latest = await getLatest(t, node1, dateq1)
  t.true(latest.success, 'node1 should get latest')
  t.true(latest.response.contacts.length === 0, 'there should be no contacts')
  t.true(latest.response.chats.length === 0, 'there should be no chats')

  //NODE1 ADDS NODE2 AS A CONTACT
  const added = await addContact(t, node1, node2)
  t.true(added, 'node1 should add node2 as contact')

  //NODE1 GETS LATEST
  const latest2 = await getLatest(t, node1, dateq1)
  t.true(latest2.success, 'node1 should get latest')
  t.true(latest2.response.contacts.length >= 1, 'there should be one contacts')
  t.true(
    latest2.response.contacts[0].public_key === node2.pubkey,
    'node2 should be the latest contact'
  )

  //NODE1 SENDS A TEXT MESSAGE TO NODE2
  const text = randomText()
  const messageSent = await sendMessageAndCheckDecryption(t, node1, node2, text)

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  const check = await checkMessageDecryption(t, node2, messageSent.uuid, text)
  t.true(check, 'node2 should have read and decrypted node1 message')

  await sleep(1000)

  //NODE1 GETS LATEST
  const latest3 = await getLatest(t, node2, dateq1)
  t.true(latest3.success, 'node2 should get latest')
  t.true(latest3.response.contacts.length === 1, 'there should be no contacts')
  t.true(latest3.response.chats.length === 1, 'there should be no chats')

  //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
  const allContacts = await getContacts(t, node1)
  let deletion
  for (const contact of allContacts) {
    if (contact.public_key == node2.pubkey) {
      deletion = await deleteContact(t, node1, contact.id)
      t.true(deletion, 'contacts should be deleted')
    }
  }
}
