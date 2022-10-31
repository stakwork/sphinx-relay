import test, { ExecutionContext } from 'ava'
import * as http from 'ava-http'
import { sleep, makeArgs, makeJwtArgs } from '../utils/helpers'
import { createTribe, joinTribe } from '../utils/save'
import {} from '../utils/msg'
import {} from '../utils/del'
import {} from '../utils/get'
import { config } from '../config'
import nodes from '../nodes'
import { randomText } from '../utils/helpers'
import {
  sendTribeMessageAndCheckDecryption,
  getAllMessages,
} from '../utils/msg'

/*
npx ava src/tests/controllers/personProfile.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'personProfile: Sphinx Person Profile',
  async (t: ExecutionContext<Context>) => {
    await personProfile(t, nodes[0], nodes[1])
  }
)

async function personProfile(t, node1, node2) {
  const internalTribeHost = node1.ip.includes('host.docker.internal')
    ? config.tribeHost
    : config.tribeHostInternal

  //GET CHALLENGE FROM PEOPLE PAGE
  const ask = await http.get('http://' + config.tribeHost + '/ask')
  const challenge = ask.challenge
  t.true(typeof challenge === 'string', 'should return challenge string')

  //VERIFY EXTERNAL FROM RELAY
  const relayVerify = await http.post(
    node1.external_ip + '/verify_external',
    makeArgs(node1)
  )
  const info = relayVerify.response.info
  t.true(
    typeof info === 'object',
    'relay verification should return info object'
  )
  const token = relayVerify.response.token
  t.true(typeof token === 'string', 'token string should exist')
  info.url = node1.external_ip
  info.route_hint = info.route_hint || ''
  info.alias = info.alias || ''
  t.true(
    info.url === node1.external_ip,
    'node1 ip should be added to info object'
  )

  //TRIBE VERIFY
  const tribesVerify = await http.post(
    'http://' + config.tribeHost + `/verify/${challenge}?token=${token}`,
    { body: info }
  )
  t.truthy(tribesVerify, 'tribe should verify')

  await sleep(1000)

  //TRIBE POLL
  const poll = await http.get(
    'http://' + config.tribeHost + `/poll/${challenge}`
  )
  await sleep(1000)

  const persontest = await http.get(
    'http://' + config.tribeHost + '/person/' + poll.pubkey
  )

  //POST PROFILE TO RELAY
  const priceToMeet = 13
  const postProfile = await http.post(
    node1.external_ip + '/profile',
    makeJwtArgs(poll.jwt, {
      pubkey: node1.pubkey,
      host: internalTribeHost,
      id: persontest.id,
      owner_alias: node1.alias,
      description: 'this description',
      img: poll.photo_url,
      tags: [],
      price_to_meet: priceToMeet,
      extras: { twitter: 'mytwitter' },
    })
  )
  t.true(postProfile.success, 'post to profile should succeed')

  //NODE2 CREATES A TRIBE
  let tribe = await createTribe(t, node2)
  t.truthy(tribe, 'tribe should have been created by node2')

  //NODE1 JOINS TRIBE CREATED BY NODE2
  if (node2.routeHint) tribe.owner_route_hint = node2.routeHint
  let join = await joinTribe(t, node1, tribe)
  t.true(join, 'node1 should join tribe')

  //NODE1 SENDS A TEXT MESSAGE IN TRIBE
  const text = randomText()
  let tribeMessage = await sendTribeMessageAndCheckDecryption(
    t,
    node1,
    node2,
    text,
    tribe
  )
  console.log(tribeMessage)

  // Get All message that belongs to Node 2
  const allMessages = await getAllMessages(node2)
  console.log(allMessages)
  t.true(!!tribeMessage, 'node1 should send message to tribe')
}
