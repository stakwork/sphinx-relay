import * as http from 'ava-http'
import { makeArgs, arraysEqual } from '../helpers'

import { encrypt } from '../../electronjs/rsa'
import { config } from '../../config'
import { getContacts, getChats, getSelf } from '../get'

export async function sendPayment(t, node1, node2, amount, text) {
  //SEND PAYMENT FROM NODE1 TO NODE2 ===>

  //get node1 balance before payment
  var node1bal = await http.get(node1.external_ip + '/balance', makeArgs(node1))
  t.true(node1bal.success, 'should get node1 balance')
  const node1beforeBalance = node1bal.response.balance

  //get node2 balance before payment
  var node2bal = await http.get(node2.external_ip + '/balance', makeArgs(node2))
  t.true(node2bal.success, 'should get node2 balance')
  const node2beforeBalance = node2bal.response.balance

  //get contacts from node1 perspective
  const [node1contact, node2contact] = await getContacts(t, node1, node2)
  //encrypt random string with node1 contact_key
  const encryptedText = encrypt(node1contact.contact_key, text)
  //encrypt random string with node2 contact_key
  const remoteText = encrypt(node2contact.contact_key, text)

  //find chat id of shared chat
  const chats = await getChats(t, node1)
  const selfie = await getSelf(t, node1)
  const selfId = selfie.id
  const sharedChat = chats.find((c) =>
    arraysEqual(c.contact_ids, [selfId, node2contact.id])
  )
  const chat_id = sharedChat?.id

  //create node2 contact id
  const contact_id = node2contact.id
  //destination key
  const destination_key = ''

  //create payment object
  const v = {
    contact_id: contact_id || null,
    chat_id: chat_id || null,
    amount: amount,
    destination_key,
    text: encryptedText,
    remote_text: remoteText,
  }
  //post payment from node1 to node2
  const pmnt = await http.post(
    node1.external_ip + '/payment',
    makeArgs(node1, v)
  )
  t.true(pmnt.success, 'payment should have been posted')

  await new Promise((resolve) => setTimeout(resolve, 1000))

  //get node1 balance after payment
  node1bal = await http.get(node1.external_ip + '/balance', makeArgs(node1))
  t.true(node1bal.success, 'should get node1 balance')
  const node1afterBalance = node1bal.response.balance

  //get node2 balance after payment
  node2bal = await http.get(node2.external_ip + '/balance', makeArgs(node2))
  t.true(node2bal.success, 'should get node2 balance')
  const node2afterBalance = node2bal.response.balance

  // console.log("NODE1 BEFORE BALANCE === ", node1beforeBalance)
  // console.log("NODE1 AFTER BALANCE === ", node1afterBalance)
  // console.log("NODE2 BEFORE BALANCE === ", node2beforeBalance)
  // console.log("NODE2 AFTER BALANCE === ", node2afterBalance)
  // console.log("NODE1 === ", (node1beforeBalance - node1afterBalance) - amount)
  // console.log("NODE2 === ", (node2afterBalance - node2beforeBalance) -  amount)

  //check that node1 sent payment and node2 received payment based on balances
  t.true(
    Math.abs(node1beforeBalance - node1afterBalance - amount) <=
      config.allowedFee,
    'node1 should have paid amount'
  )
  t.true(
    Math.abs(node2afterBalance - node2beforeBalance - amount) <=
      config.allowedFee,
    'node2 should have received amount'
  )

  return true
}
