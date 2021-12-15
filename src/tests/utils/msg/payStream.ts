import { config } from '../../config'
import { Assertions } from 'ava'
import http = require('ava-http')
import { NodeConfig } from '../../types'
import { getChats, getBalance, getCheckNewStream } from '../get'
import { makeArgs, randomText } from '../helpers'

export async function payStream(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  node3: NodeConfig | null,
  amount: number
) {
  //NODE STREAMS PAYMENT ===>

  //check and record balances for all nodes
  const beforeBal = await getBalance(t, node1)
  const beforeBal2 = await getBalance(t, node2)
  var beforeBal3 = 0
  if (node3) beforeBal3 = await getBalance(t, node3)

  //create destinations array for node2 with 100% of payment
  const destinations = [
    {
      address: node2.pubkey,
      split: 100,
      type: 'node',
    },
  ]

  //if node3 exists, lower node2 payment to 50% and add node3 destination at 50%
  if (node3) {
    destinations[0].split = 50
    destinations.push({
      address: node3.pubkey,
      split: 50,
      type: 'node',
    })
  }

  //create arbirary text blob (to be checked in chat later)
  const string = randomText()
  const text = JSON.stringify({
    feedID: 11,
    itemID: 12,
    ts: 13,
    text: string,
  })

  //update meta is true for stream post object
  const update_meta = true

  //acquire chat_id for stream post object
  const chats = await getChats(t, node1)
  const chat_id = chats[0].id

  //create stream post object v
  const v = {
    destinations,
    text,
    amount,
    chat_id,
    update_meta,
  }

  //node1 sends a stream/feed payment
  var stream = await http.post(
    node1.external_ip + '/stream',
    makeArgs(node1, v)
  )
  t.truthy(stream)

  //check that node2 has received stream payment message
  const streamCheck = await getCheckNewStream(t, node2, string)
  t.truthy(streamCheck)
  //if node3, check that node3 has received stream payment message
  if (node3) {
    const streamCheck = await getCheckNewStream(t, node3, string)
    t.truthy(streamCheck)
  }

  //check that meta in chat has updated with text blob
  const afterChat = await getChats(t, node1)
  t.truthy(afterChat, 'node1 should get chats again')
  const sameChat = afterChat.find((chat) => chat.id === chat_id)
  t.truthy(sameChat.meta, 'text blob should be in meta')

  //get and record balances after payment
  const afterBal = await getBalance(t, node1)
  const afterBal2 = await getBalance(t, node2)
  var afterBal3 = 0
  if (node3) afterBal3 = await getBalance(t, node3)

  //check that balances have moved within range of Allowed Fee
  t.true(
    Math.abs(beforeBal - afterBal - amount) <= config.allowedFee,
    'node1 should have lost amount'
  )
  if (node3) {
    t.true(
      Math.abs(afterBal2 - beforeBal2 - amount / 2) <= config.allowedFee,
      'node2 should have gained half of amount'
    )
    t.true(
      Math.abs(afterBal3 - beforeBal3 - amount / 2) <= config.allowedFee,
      'node3 should have gained half of amount'
    )
  } else {
    t.true(
      Math.abs(afterBal2 - beforeBal2 - amount) <= config.allowedFee,
      'node2 should have gained amount'
    )
  }

  return true
}
