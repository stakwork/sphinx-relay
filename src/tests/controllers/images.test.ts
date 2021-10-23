import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { iterate } from '../utils/helpers'
import { greenSquare, pinkSquare } from '../configs/b64-images'
import { NodeConfig } from '../types'
import { addContact } from '../utils/save/addContact'
import { getContacts } from '../utils/get'
import { deleteContact } from '../utils/del/deleteContact'
import { sendImage } from '../utils/msg/sendImage'

/*
npx ava test-03-imageTest.js --verbose --serial --timeout=2m
*/

/*test('test-03-imageTest: add contact, send images, delete contacts', async (t) => {
	const nodeArray = r[r.active]
	await h.runTest(t, imageTest, nodeArray, r.iterate)
})*/

interface Context {}

test.serial('checkImages', async (t: ExecutionContext<Context>) => {
	t.true(Array.isArray(nodes))
	await iterate(nodes, async (node1, node2) => {
		await imageTest(t, node1, node2)
	})
})

async function imageTest(
	t: ExecutionContext<Context>,
	node1: NodeConfig,
	node2: NodeConfig
) {
	//TWO NODES SEND EACH OTHER IMAGES ===>

	console.log(`Testing Sending Image for ${node1.alias} and ${node2.alias}`)

	//NODE1 ADDS NODE2 AS A CONTACT
	const added = await addContact(t, node1, node2)
	t.true(added, 'n1 should add n2 as contact')

	//NODE1 SEND IMAGE TO NODE2
	const image = greenSquare
	const imageSent = await sendImage(t, node1, node2, image)
	t.true(imageSent, 'image should have been sent')

	//NODE2 SENDS AN IMAGE TO NODE1
	const image2 = pinkSquare
	const imageSent2 = await sendImage(t, node2, node1, image2)
	t.true(imageSent2, 'image should have been sent')

	//NODE1 SEND IMAGE TO NODE2
	const price = 11
	const paidImageSent = await sendImage(t, node1, node2, image, null, price)
	t.true(paidImageSent, 'paid image should have been sent')

	//NODE2 SENDS AN IMAGE TO NODE1
	const price2 = 12
	const paidImageSent2 = await sendImage(t, node2, node1, image2, null, price2)
	t.true(paidImageSent2, 'paid image should have been sent')

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

module.exports = imageTest
