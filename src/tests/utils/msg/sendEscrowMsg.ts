import * as http from 'ava-http'
import { encrypt } from '../../electronjs/rsa'
import {
  getSelf,
  getCheckNewMsgs,
  getTribeIdFromUUID,
  getBalance,
} from '../get'
import { makeArgs, sleep } from '../helpers'
import { run } from '../../configs/test-config'

export async function sendEscrowMsg(t, node, admin, tribe, text) {
  //NODE POSTS MESSAGE TO TRIBE ===>

  const escrowAmount = tribe.escrow_amount
  t.true(escrowAmount != 0, 'escrow amount should not be zero')
  // console.log("escrowAmount === ", escrowAmount)

  const escrowMillis = tribe.escrow_millis
  t.true(escrowMillis != 0, 'escrow time should not be zero')
  // console.log("escrowMillis === ", escrowMillis)

  var pricePerMessage = 0
  if (tribe.price_per_message) pricePerMessage = tribe.price_per_message
  // console.log("PPM === ", pricePerMessage)

  let nodeContact = await getSelf(t, node)

  //encrypt random string with node contact_key
  const encryptedText = encrypt(nodeContact.contact_key, text)
  //encrypt random string with test tribe group_key from node1
  const remoteText = encrypt(tribe.group_key, text)

  const tribeId = await getTribeIdFromUUID(t, node, tribe)
  t.truthy(tribeId, 'node should get tribe id')

  //create test tribe message object
  const v = {
    contact_id: null,
    chat_id: tribeId,
    text: encryptedText,
    remote_text_map: { chat: remoteText },
    amount: escrowAmount + pricePerMessage || 0,
    reply_uuid: '',
    boost: false,
  }

  //get balances BEFORE message
  const [nodeBalBefore, adminBalBefore] = await escrowBalances(t, node, admin)

  //send message from node to test tribe
  const msg = await http.post(node.exteranl_ip + '/messages', makeArgs(node, v))
  //make sure msg exists
  t.true(msg.success, 'node should send message to tribe')
  const msgUuid = msg.response.uuid
  t.truthy(msgUuid, 'message uuid should exist')

  //await message to post
  const escrowMsg = await getCheckNewMsgs(t, admin, msgUuid)
  t.truthy(escrowMsg, 'should find escrow message posted')

  //get balances DURING escrow
  const [nodeBalDuring, adminBalDuring] = await escrowBalances(t, node, admin)
  //pause for escrow time
  await sleep(escrowMillis + 1)
  //get balances AFTER escrow
  const [nodeBalAfter, adminBalAfter] = await escrowBalances(t, node, admin)

  // console.log("adminBalBefore === ", adminBalBefore)
  // console.log("nodeBalBefore === ", nodeBalBefore)
  // console.log("adminBalDuring === ", adminBalDuring)
  // console.log("nodeBalDuring === ", nodeBalDuring)
  // console.log("adminBalAfter === ", adminBalAfter)
  // console.log("nodeBalAfter === ", nodeBalAfter)

  //ON VOLTAGE NODE:
  //ADMIN LOSES r.allowedFee BETWEEN DURING AND AFTER
  //NODE LOSES r.allowedFee BETWEEN BEFORE AND DURING

  //Check admin balances throughout
  t.true(
    Math.abs(adminBalBefore + pricePerMessage - adminBalAfter) <=
      run.allowedFee,
    'admin end balance should increase by ppm'
  )
  t.true(
    Math.abs(
      adminBalBefore + pricePerMessage + escrowAmount - adminBalDuring
    ) <= run.allowedFee,
    'admin should hold escrowAmount and ppm during escrow'
  )
  t.true(
    Math.abs(adminBalDuring - escrowAmount - adminBalAfter) <= run.allowedFee,
    'admin should lose escrowAmount after escrowMillis'
  )

  //Check node balances throughout
  t.true(
    Math.abs(nodeBalBefore - pricePerMessage - nodeBalAfter) <= run.allowedFee,
    'node end balance should decrease by ppm'
  )
  t.true(
    Math.abs(nodeBalBefore - pricePerMessage - escrowAmount - nodeBalDuring) <=
      run.allowedFee,
    'node should lose escrowAmount and ppm during escrow'
  )
  t.true(
    Math.abs(nodeBalDuring + escrowAmount - nodeBalAfter) <= run.allowedFee,
    'node should gain escrowAmount after escrowMillis'
  )

  return { success: true, message: msg.response }
}

async function escrowBalances(t, node, admin) {
  const adminBal = await getBalance(t, admin)
  t.true(typeof adminBal === 'number')
  const nodeBal = await getBalance(t, node)
  t.true(typeof nodeBal === 'number')
  return [nodeBal, adminBal]
}
