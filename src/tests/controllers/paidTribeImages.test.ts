import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { pinkSquare, greenSquare } from '../configs/b64-images'
import { iterate } from '../utils/helpers'
import { sendImage } from '../utils/msg'
import { leaveTribe, deleteTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'

/*
npx ava src/tests/controllers/paidTribeImages.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('checkContacts', async (t: ExecutionContext<Context>) => {
	t.true(Array.isArray(nodes))
	await iterate(nodes, async (node1, node2) => {
		await paidTribeImages(t, node1, node2)
	})
})

export async function paidTribeImages(t, node1, node2) {
	//TWO NODES SEND PAID IMAGES TO EACH OTHER ===>
	console.log(`${node1.alias} and ${node2.alias}`)

	//NODE1 CREATES A TRIBE
	let tribe = await createTribe(t, node1)
	t.truthy(tribe, 'tribe should have been created by node1')

	//NODE2 JOINS TRIBE CREATED BY NODE1
	if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
	let join = await joinTribe(t, node2, tribe)
	t.true(join, 'node2 should join tribe')

	//NODE1 SEND IMAGE TO NODE2
	const image = greenSquare
	const price = 11
	const imageSent = await sendImage(t, node1, node2, image, tribe, price)
	t.true(imageSent, 'message should have been sent')

	//NODE2 SENDS AN IMAGE TO NODE1
	const image2 = pinkSquare
	const price2 = 12
	const imageSent2 = await sendImage(t, node2, node1, image2, tribe, price2)
	t.true(imageSent2, 'message should have been sent')

	//NODE2 LEAVES TRIBE
	let left2 = await leaveTribe(t, node2, tribe)
	t.true(left2, 'node2 should leave tribe')

	//NODE1 DELETES TRIBE
	let delTribe2 = await deleteTribe(t, node1, tribe)
	t.true(delTribe2, 'node1 should delete tribe')
}
