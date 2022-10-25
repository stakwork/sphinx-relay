import test, { ExecutionContext } from 'ava'
import * as http from 'ava-http'
import { sleep, makeArgs, makeJwtArgs } from '../utils/helpers'
import {} from '../utils/save'
import {} from '../utils/msg'
import {} from '../utils/del'
import {} from '../utils/get'
import { config } from '../config'
import nodes from '../nodes'

/*
npx ava src/tests/controllers/sphinxPeople.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'sphinxPeople: Sphinx People testing',
  async (t: ExecutionContext<Context>) => {
    await sphinxPeople(t, nodes[0])
  }
)

async function sphinxPeople(t, node1) {
  //TESTING FOR SPHINX PEOPLE PAGE ===>

  // if running "no-alice" version with local relay
  const internalTribeHost = node1.ip.includes('host.docker.internal')
    ? config.tribeHost
    : config.tribeHostInternal

  console.log(node1.alias)

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

  await sleep(1000)

  //GET PERSON FROM TRIBE SERVER
  const person = await http.get(
    'http://' + config.tribeHost + '/person/' + poll.pubkey
  )
  t.truthy(person.extras.twitter === 'mytwitter', 'extra should exist')

  //GET PERSON FROM RELAY
  const res = await http.get(node1.external_ip + '/contacts', makeArgs(node1))
  //create node contact object from node perspective
  let self = res.response.contacts.find(
    (contact) => contact.public_key === node1.pubkey
  )

  //CHECK THAT PRICE TO MEET FROM TRIBES IS SAME AS PRICE TO MEET FROM RELAY
  t.true(
    person.price_to_meet === priceToMeet,
    'tribe server profile should have price to meet'
  )
  t.true(
    person.price_to_meet === self.price_to_meet,
    'relay server should have price to meet'
  )

  //UPDATE AND RESET PRICE_TO_MEET WITH PROFILE POST ID
  const newPriceToMeet = 0
  const postProfile2 = await http.post(
    node1.external_ip + `/profile`,
    makeJwtArgs(poll.jwt, {
      pubkey: node1.pubkey,
      id: person.id,
      host: internalTribeHost,
      owner_alias: node1.alias,
      description: 'this description',
      img: poll.photo_url,
      tags: [],
      price_to_meet: newPriceToMeet,
    })
  )
  t.true(postProfile2.success, 'post to profile with id should succeed')

  await sleep(1000)

  //GET PERSON FROM TRIBE SERVER
  const person2 = await http.get(
    'http://' + config.tribeHost + '/person/' + poll.pubkey
  )

  //GET PERSON FROM RELAY
  const res2 = await http.get(node1.external_ip + '/contacts', makeArgs(node1))
  //create node contact object from node perspective
  let self2 = res2.response.contacts.find(
    (contact) => contact.public_key === node1.pubkey
  )

  //CHECK THAT PRICE TO MEET FROM TRIBES IS SAME AS PRICE TO MEET FROM RELAY
  t.true(
    person2.price_to_meet === newPriceToMeet,
    'tribes server should reset price to meet to newPriceToMeet'
  )
  t.true(
    person2.price_to_meet === self2.price_to_meet,
    'Relay server should reset price to meet to newPriceToMeet'
  )

  //TRY TO UPDATE AND RESET PRICE_TO_MEET WITH RANDOM ID
  // try {
  //   await http.post(
  //     node1.external_ip + `/profile`,
  //     makeJwtArgs(poll.jwt, {
  //       id: 321,
  //       host: internalTribeHost,
  //       owner_alias: node1.alias,
  //       description: 'this description',
  //       img: poll.photo_url,
  //       tags: [],
  //       price_to_meet: newPriceToMeet,
  //     })
  //   )
  // } catch (e) {}

  //DELETE PERSON PROFILE AT END OF TEST
  const del = await http.del(
    node1.external_ip + '/profile',
    makeArgs(node1, { id: person2.id, host: internalTribeHost })
  )
  t.true(del.success, 'profile should be deleted')
}
