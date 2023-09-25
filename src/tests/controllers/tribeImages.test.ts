import test from 'ava'
import { iterate } from '../utils/helpers'
import nodes from '../nodes'
import { createTribe, joinTribe } from '../utils/save'
import { deleteTribe, leaveTribe } from '../utils/del'
import { sendImage } from '../utils/msg'
import { greenSquare, pinkSquare } from '../utils/base64images'
import { sleep } from '../../helpers'

/*
npx ava src/tests/controllers/tribeImages.test.ts --verbose --serial --timeout=2m
*/

test('test tribeImages: create tribe, join tribe, send images, leave tribe, delete tribe', async (t) => {
  await iterate(nodes, async (node1, node2) => {
    await tribeImages(t, node1, node2)
  })
})

export async function tribeImages(t, node1, node2) {
  //TWO NODES SEND IMAGES WITHIN A TRIBE ===>

  console.log(`Sending Tribe images from ${node1.alias} and ${node2.alias}`)

  //NODE1 CREATES A TRIBE
  let tribe = await createTribe(t, node1)
  t.truthy(tribe, 'tribe should have been created by node1')

  //NODE2 JOINS TRIBE CREATED BY NODE1
  if (node1.routeHint) tribe.owner_route_hint = node1.routeHint
  let join = await joinTribe(t, node2, tribe)
  t.true(join, 'node2 should join tribe')

  //NODE1 SEND IMAGE TO NODE2
  const image = greenSquare
  const imageSent = await sendImage(t, node1, node2, image, tribe)
  t.true(!!imageSent, 'message should have been sent')

  //NODE2 SENDS AN IMAGE TO NODE1
  const image2 = pinkSquare
  const imageSent2 = await sendImage(t, node2, node1, image2, tribe)
  t.true(!!imageSent2, 'message should have been sent')

  //NODE2 LEAVES TRIBE
  let left2 = await leaveTribe(t, node2, tribe)
  t.true(left2, 'node2 should leave tribe')

  await sleep(2000)

  //NODE1 DELETES TRIBE
  let delTribe2 = await deleteTribe(t, node1, tribe)
  t.true(delTribe2, 'node1 should delete tribe')
}
