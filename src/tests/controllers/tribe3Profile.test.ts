import test from 'ava'

import { randomText } from '../utils/helpers'
import { deleteTribe, leaveTribe } from '../utils/del'
import { createTribe, joinTribe, updateProfile } from '../utils/save'
import { getSelf, getCheckNewMsgs } from '../utils/get'
import { checkMessageDecryption, sendTribeMessage } from '../utils/msg'
import nodes from '../nodes'

/*
npx ava test-14-tribe3Profile.js --verbose --serial --timeout=2m
*/

test('test-14-tribe3Profile: create tribe, two nodes join tribe, change alias and profile pic, check change, delete tribe', async (t) => {
  await tribe3Profile(t, nodes[0], nodes[1], nodes[2])
})

async function tribe3Profile(t, node1, node2, node3) {
  //THREE NODES EDIT AND CHECK PROFILE PICS AND ALIAS ===>
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

  //GET NODE1 PROFILE INFO
  const oldSelf = await getSelf(t, node1)
  console.log('OOOLD SELF === ', oldSelf)
  var oldName = oldSelf.alias
  var oldPic = oldSelf.photo_url || ''

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text = randomText()
  let tribeMessage = await sendTribeMessage(t, node1, tribe, text)

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n2check = await checkMessageDecryption(
    t,
    node2,
    tribeMessage.uuid,
    text
  )
  t.true(n2check, 'node2 should have read and decrypted node1 message')

  const lastMsg = await getCheckNewMsgs(t, node2, tribeMessage.uuid)
  console.log('oldName === ', oldName)
  console.log('lastMsg.sender_alias === ', oldName)
  console.log('oldPic === ', oldPic)
  console.log('lastMsg.sender_pic === ', oldName)

  t.true(
    lastMsg.sender_alias === oldName,
    'message alias should equal node1 old name'
  )
  t.true(
    lastMsg.sender_pic === oldPic,
    'message profile pic should equal node1 old pic'
  )

  //NODE1 CHANGES PROFILE ALIAS
  const newName = 'New Name 1'
  const newAlias = { alias: newName }
  const change1 = await updateProfile(t, node1, newAlias)
  t.true(change1, 'node1 should have changed its alias')

  //NODE1 CHANGES PROFILE PIC URL
  const newPic = '//imgur.com/a/axsiHTi'
  // const newPic = ''
  const newPhotoUrl = { photo_url: newPic }
  const change2 = await updateProfile(t, node1, newPhotoUrl)
  t.true(change2, 'node1 should have changed its profile pic')

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text2 = randomText()
  let tribeMessage2 = await sendTribeMessage(t, node1, tribe, text2)

  //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n2check2 = await checkMessageDecryption(
    t,
    node2,
    tribeMessage2.uuid,
    text2
  )
  t.true(n2check2, 'node2 should have read and decrypted node1 message')
  const lastMsg2 = await getCheckNewMsgs(t, node2, tribeMessage2.uuid)
  t.true(
    lastMsg2.sender_alias === newName,
    'message alias should equal node1 new name'
  )
  t.true(
    lastMsg2.sender_pic === newPic,
    'message profile pic should equal node1 new pic'
  )

  //RESET NODE1 PROFILE
  const oldAlias = { alias: oldName }
  let reset1 = await updateProfile(t, node1, oldAlias)
  t.true(reset1, 'node1 should have reset its old alias')
  const oldPhotoUrl = { photo_url: oldPic }
  let reset2 = await updateProfile(t, node1, oldPhotoUrl)
  t.true(reset2, 'node1 should have reset its old profile pic')

  //GET NODE2 PROFILE INFO
  const oldSelf2 = await getSelf(t, node2)
  var oldName2 = oldSelf2.alias
  var oldPic2 = oldSelf2.photo_url || ''

  //NODE2 SENDS A TEXT MESSAGE IN TRIBE
  const text3 = randomText()
  let tribeMessage3 = await sendTribeMessage(t, node2, tribe, text3)

  //NODE1 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n1check = await checkMessageDecryption(
    t,
    node1,
    tribeMessage3.uuid,
    text3
  )
  t.true(n1check, 'node1 should have read and decrypted node2 message')

  const lastMsg3 = await getCheckNewMsgs(t, node1, tribeMessage3.uuid)
  t.true(
    lastMsg3.sender_alias === oldName2,
    'message alias should equal node2 old name'
  )
  t.true(
    lastMsg3.sender_pic === oldPic2,
    'message profile pic should equal node2 old pic'
  )

  //NODE3 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check = await checkMessageDecryption(
    t,
    node3,
    tribeMessage3.uuid,
    text3
  )
  t.true(n3check, 'node3 should have read and decrypted node2 message')

  const lastMsg4 = await getCheckNewMsgs(t, node3, tribeMessage3.uuid)
  t.true(
    lastMsg4.sender_alias === oldName2,
    'message alias should equal node2 old name'
  )
  t.true(
    lastMsg4.sender_pic === oldPic2,
    'message profile pic should equal node2 old pic'
  )

  //NODE2 CHANGES PROFILE ALIAS
  const newName2 = 'New Name 2'
  const newAlias2 = { alias: newName2 }
  const change3 = await updateProfile(t, node2, newAlias2)
  t.true(change3, 'node2 should have changed its alias')

  //NODE2 CHANGES PROFILE PIC URL
  let change4 = await updateProfile(t, node2, newPhotoUrl)
  t.true(change4, 'node2 should have changed its profile pic')

  //NODE2 SENDS A TEXT MESSAGE IN TRIBE
  const text4 = randomText()
  let tribeMessage4 = await sendTribeMessage(t, node2, tribe, text4)

  //NODE1 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n1check2 = await checkMessageDecryption(
    t,
    node1,
    tribeMessage4.uuid,
    text4
  )
  t.true(n1check2, 'node1 should have read and decrypted node2 message')

  const lastMsg5 = await getCheckNewMsgs(t, node1, tribeMessage4.uuid)
  t.true(
    lastMsg5.sender_alias === newName2,
    'message alias should equal node2 new name'
  )
  t.true(
    lastMsg5.sender_pic === newPic,
    'message profile pic should equal node2 new pic'
  )

  //NODE3 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
  const n3check2 = await checkMessageDecryption(
    t,
    node3,
    tribeMessage4.uuid,
    text4
  )
  t.true(n3check2, 'node3 should have read and decrypted node2 message')

  const lastMsg6 = await getCheckNewMsgs(t, node3, tribeMessage4.uuid)
  t.true(
    lastMsg6.sender_alias === newName2,
    'message alias should equal node2 new name'
  )
  t.true(
    lastMsg6.sender_pic === newPic,
    'message profile pic should equal node2 new pic'
  )

  //RESET NODE2 PROFILE
  const oldAlias2 = { alias: oldName2 }
  let reset3 = await updateProfile(t, node2, oldAlias2)
  t.true(reset3, 'node2 should have reset its old alias')
  const oldPhotoUrl2 = { photo_url: oldPic2 }
  let reset4 = await updateProfile(t, node2, oldPhotoUrl2)
  t.true(reset4, 'node2 should have reset its old profile pic')

  //NODE2 LEAVES THE TRIBE
  let n2left = await leaveTribe(t, node2, tribe)
  t.true(n2left, 'node2 should leave tribe')

  //NODE3 LEAVES THE TRIBE
  let n3left = await leaveTribe(t, node3, tribe)
  t.true(n3left, 'node3 should leave tribe')

  //NODE1 DELETES THE TRIBE
  let delTribe = await deleteTribe(t, node1, tribe)
  t.true(delTribe, 'node1 should delete tribe')
}
