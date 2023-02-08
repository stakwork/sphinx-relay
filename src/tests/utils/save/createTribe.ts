import { Assertions } from 'ava'
import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { getCheckTribe } from '../get'
import { NodeConfig } from '../../types'

export async function createTribe(
  t: Assertions,
  node: NodeConfig,
  escrowAmount?: number,
  escrowMillis?: number,
  ppm?: number,
  privacy?: boolean
) {
  const name = `Test Tribe: ${node.alias}`
  const description = 'A testing tribe'
  //new tribe object
  const newTribe = {
    name,
    description,
    tags: [],
    is_tribe: true,
    price_per_message: ppm || 0,
    price_to_join: 0,
    escrow_amount: escrowAmount || 0,
    escrow_millis: escrowMillis || 0,
    img: '',
    unlisted: true,
    private: privacy || false,
    app_url: '',
    feed_url: '',
    feed_type: 0,
    pin: 'A pinned message',
    meme_server_location:
      'https://stakwork-uploads.s3.amazonaws.com/sphinx-private-graph/',
  }

  //node1 creates new tribe
  let c = await http.post(node.external_ip + '/group', makeArgs(node, newTribe))
  //check that new tribe was created successfully
  t.true(c.success, 'create tribe should be successful')

  //save id of test tribe
  const newTribeId = c.response.id
  //get new tribe by Id
  const r = await getCheckTribe(t, node, newTribeId)
  //check that the chat was found
  t.true(typeof r === 'object', 'the newly created chat should be found')

  return r
}
