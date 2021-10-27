var test = require('ava')
import { randomText } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe } from '../utils/save'
import { sendTribeMessageAndCheckDecryption } from '../utils/msg'
import nodes from '../nodes'

/*
npx ava test-21-boostPayment.js --verbose --serial --timeout=2m
*/

test('test-21-boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await boostPayment(t, 0, 1, 2)
})

export async function boostPayment(t, index1, index2, index3) {
  //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
  let node1 = nodes[index1]
  let node2 = nodes[index2]
  let node3 = nodes[index3]
  t.truthy(node3, 'this test requires three nodes')

  console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`)

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE3 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join2 = await joinTribe(t, node3, tribe)
  t.true(join2, 'node3 should join tribe')

  //NODE1 SENDS A MESSAGE IN THE TRIBE
  const text = randomText()
  let tribeMessage1 = await sendTribeMessageAndCheckDecryption(
    t,
    node1,
    node2,
    text,
    tribe
  )
  t.true(tribeMessage1, 'node1 should send message to tribe')

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  /*const check = await checkDecrypt(t, node2, text, tribeMessage1.message)
	t.true(check, 'node2 should have read and decrypted node1 message')
*/
  //NODE2 SENDS A MESSAGE IN THE TRIBE
  /*const text2 = randomText()
	let tribeMessage2 = await sendTribeMessageAndCheckDecryption(
		t,
		node2,
		node3,
		text2,
		tribe
	)
	//t.true(tribeMessage2.success, 'node2 should send message to tribe')

	//CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
	/*
	const check2 = await checkDecrypt(t, node3, text2, tribeMessage2.message)
	t.true(check2, 'node3 should have read and decrypted node2 message')
	*/

  //NODE3 SENDS A MESSAGE IN THE TRIBE
  //const text3 = randomText()
  /*let tribeMessage3 = await sendTribeMessageAndCheckDecryption(
		t,
		node3,
		node1,
		text3,
		tribe
	)*/
  //t.true(tribeMessage3.success, 'node3 should send message to tribe')

  //CHECK THAT NODE3'S DECRYPTED MESSAGE IS SAME AS INPUT
  /*
	const check3 = await checkDecrypt(t, node1, text3, tribeMessage3.message)
	t.true(check3, 'node1 should have read and decrypted node3 message')
	*/

  //NODE1 SENDS A BOOST ON NODE2'S MESSAGE
  //const boost = await sendBoost(t, node1, node2, tribeMessage2, 11, tribe)
  //t.true(boost.success)

  //NODE2 SENDS A BOOST ON NODE3'S MESSAGE
  //const boost2 = await sendBoost(t, node2, node3, tribeMessage3, 12, tribe)
  //t.true(boost2.success)

  //NODE3 SENDS A BOOST ON NODE1'S MESSAGE
  //const boost3 = await sendBoost(t, node3, node1, tribeMessage1, 13, tribe)
  //t.true(boost3.success)

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  //NODE3 LEAVES TRIBE
  let left3 = await leaveTribe(t, node3, tribe)
  t.true(left3, 'node3 should leave tribe')

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
