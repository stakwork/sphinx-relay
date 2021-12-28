import test, { ExecutionContext } from 'ava'
import * as http from 'ava-http'
import { randomText, makeArgs, iterate } from '../utils/helpers'
import { deleteContact } from '../utils/del'
import { addContact, updateProfile } from '../utils/save'
import { getSelf, getContacts } from '../utils/get'
import { sendMessageAndCheckDecryption } from '../utils/msg'
import nodes from '../nodes'
import { clearAllContacts } from '../controllers/clearAllContacts.test'

/*
npx ava test-41-paidMeet.js --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'test-41-paidMeet: update price_to_meet, add contact paid/unpaid, reset contact',
  async (t: ExecutionContext<Context>) => {
    t.true(Array.isArray(nodes))
    await iterate(nodes, async (node1, node2) => {
      await paidMeet(t, node1, node2)
    })
  }
)

async function paidMeet(t, node1, node2) {
  //NODE2 ADDS NODE1 AS A CONTACT WITH AND WITHOUT PRICE_TO_MEET ===>

  console.log(`${node1.alias} and ${node2.alias}`)

  //NODE1 CHANGES PROFILE ALIAS
  const meetPrice = { price_to_meet: 13 }
  const change = await updateProfile(t, node1, meetPrice)
  t.true(change, 'node1 should have changed its price to meet')

  //NODE1 CHECK CONTACT INFO
  const self = await getSelf(t, node1)
  t.true(self.price_to_meet === 13, 'node1 should have updated price_to_meet')

  //DELETE ALL CONTACTS
  const clear = await clearAllContacts(t)
  t.truthy(clear, 'all contacts should be cleared')

  //NODE2 ADDS NODE1 AS A CONTACT
  let added = await addContact(t, node2, node1)
  t.true(added, 'node2 should add node1 as contact')

  //NODE2 SENDS A TEXT MESSAGE TO NODE1
  const text = randomText()
  await sendMessageAndCheckDecryption(t, node2, node1, text)

  //GET CONTACTS FROM NODE1, NODE2 WILL NOT BE LISTED
  const contacts = await http.get(
    node1.external_ip + '/contacts',
    makeArgs(node1)
  )
  t.falsy(
    contacts.response.contacts.find((c) => c.public_key === node2.pubkey),
    'node2 will not be listed in contacts'
  )

  //GET CONTACTS FROM NODE1 INCLUDING UNMET, NODE2 WILL BE LISTED
  const contacts2 = await http.get(
    node1.external_ip + '/contacts?unmet=include',
    makeArgs(node1)
  )
  // console.log("contacts2 === ", JSON.stringify(contacts2.response.contacts))
  t.truthy(
    contacts2.response.contacts.find((c) => c.public_key === node2.pubkey),
    'node2 will be listed in unmet contacts'
  )

  //ATTEMPT CONTACT AGAIN

  //NODE2 SENDS A TEXT MESSAGE TO NODE1
  const text2 = randomText()
  const amount = 13
  await sendMessageAndCheckDecryption(t, node2, node1, text2, { amount })

  //GET CONTACTS FROM NODE1, NODE2 WILL BE LISTED
  const contacts3 = await http.get(
    node1.external_ip + '/contacts',
    makeArgs(node1)
  )
  // console.log("contacts3 === ", JSON.stringify(contacts3.response.contacts))
  t.truthy(
    contacts3.response.contacts.find((c) => c.public_key === node2.pubkey),
    'node2 will be listed in contacts'
  )

  //DELETE ALL CONTACTS
  const clear = await clearAllContacts(t)
  t.truthy(clear, 'all contacts should be cleared')

  //NODE2 ADDS NODE1 AS A CONTACT WITH CORRECT PRICE TO MEET
  let added3 = await addContact(t, node2, node1)
  t.true(added3, 'node2 should add node1 as contact again')

  //NODE2 SENDS A TEXT MESSAGE TO NODE1
  const text3 = randomText()
  const amount2 = 13
  await sendMessageAndCheckDecryption(t, node2, node1, text3, {
    amount: amount2,
  })

  //GET CONTACTS FROM NODE1, NODE2 WILL BE LISTED
  const contacts5 = await http.get(
    node1.external_ip + '/contacts',
    makeArgs(node1)
  )
  // console.log("contacts5 === ", JSON.stringify(contacts5.response.contacts))
  t.truthy(
    contacts5.response.contacts.find((c) => c.public_key === node2.pubkey),
    'node2 will be listed in contacts'
  )

  //NODE1 RESETS PROFILE
  const meetPrice2 = { price_to_meet: 0 }
  const change2 = await updateProfile(t, node1, meetPrice2)
  t.true(change2, 'node1 should have changed its price to meet')

  //NODE1 CHECK CONTACT INFO
  const self2 = await getSelf(t, node1)
  t.true(self2.price_to_meet === 0, 'node1 price_to_meet should be reset to 0')

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
