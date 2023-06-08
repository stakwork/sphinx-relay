import test, { ExecutionContext } from 'ava'
import * as moment from 'moment'
import nodes from '../nodes'
import { randomText, iterate, sleep } from '../utils/helpers'
import { getContactAndCheckKeyExchange } from '../utils/get'
import { NodeConfig, Message } from '../types'
import { Assertions } from 'ava'
import * as http from 'ava-http'
import * as rsa from '../../crypto/rsa'
import { makeArgs } from '../utils/helpers'

/*
npx ava src/tests/controllers/transportToken.test.ts --verbose --serial --timeout=2m
*/
/*
sqlite3 /Users/evanfeenstra/code/sphinx/sphinx-stack/relay/db/bob.db
*/

interface Context {}

test.serial(
  'checkContactsWithTransportToken',
  async (t: ExecutionContext<Context>) => {
    t.true(Array.isArray(nodes))
    await iterate(nodes, async (node1, node2) => {
      await checkContactsWithTransportToken(t, node1, node2)
      await check1MinuteOldRequest(t, node1, node2)
      await checkDuplicateTransportTokens(t, node1, node2)
    })
  }
)

async function checkDuplicateTransportTokens(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  const body = {
    alias: `${node2.alias}`,
    public_key: node2.pubkey,
    status: 1,
    route_hint: node2.routeHint || '',
  }
  const currentTime = moment().unix()
  console.log('This is the current time: ', currentTime)
  const transportToken = rsa.encrypt(
    node1.transportToken,
    `${node1.authToken}|${moment().unix()}`
  )
  await sleep(1000)
  let added = await http.post(node1.external_ip + '/contacts', {
    headers: {
      'x-transport-token': transportToken,
    },
    body,
  })
  t.true(added.success, 'we should get back a value from the request')
  // FIXME re-enable the replay test once apps are always sure to do unique ts
  // let error
  // let added2
  // try {
  //   added2 = await http.post(node1.external_ip + '/contacts', {
  //     headers: {
  //       'x-transport-token': transportToken,
  //     },
  //     body,
  //   })
  // } catch (e) {
  //   error = e
  // }
  // t.true(
  //   added2 == undefined,
  //   'added2 should remain undefined as the try catch should fail'
  // )
  // t.true(
  //   error.statusCode == 401,
  //   'node1 should have failed due to old transportToken and have 401 code'
  // )
  // t.true(
  //   error.error == 'invalid credentials',
  //   'node1 should have failed due to old and should have correct error'
  // )
}

async function check1MinuteOldRequest(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  const body = {
    alias: `${node2.alias}`,
    public_key: node2.pubkey,
    status: 1,
    route_hint: node2.routeHint || '',
  }
  const currentTime = moment().unix() - 1 * 61
  let error
  try {
    await sleep(1000)
    await http.post(node1.external_ip + '/contacts', {
      headers: {
        'x-transport-token': rsa.encrypt(
          node1.transportToken,
          `${node1.authToken}|${currentTime.toString()}`
        ),
      },
      body,
    })
  } catch (e) {
    error = e
  }
  t.true(
    error.statusCode == 401,
    'node1 should have failed due to old transportToken and have 401 code'
  )
  // t.true(
  //   error.error == 'invalid credentials',
  //   'node1 should have failed due to old and should have correct error'
  // )
}

async function checkContactsWithTransportToken(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  console.log(
    `=> checkContactsWithTransportToken ${node1.alias} -> ${node2.alias}`
  )
  // NODE1 ADDS NODE2 AS A CONTACT
  // contact_key should be populated via key exchange in a few seconds
  let added = await addContact(t, node1, node2)
  t.true(added, 'node1 should add node2 as contact')
  console.log('added contact!')

  const text = randomText()
  await sleep(1000)
  let messageSent = await sendMessageAndCheckDecryption(t, node1, node2, text)
  t.truthy(messageSent, 'node1 should send text message to node2')
  console.log('sent message!')
}

async function addContact(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig
): Promise<boolean> {
  //object of node2node for adding as contact
  const body = {
    alias: `${node2.alias}`,
    public_key: node2.pubkey,
    status: 1,
    route_hint: node2.routeHint || '',
  }

  await sleep(1000)
  //node1 adds node2 as contact
  const add = await http.post(
    node1.external_ip + '/contacts',
    makeArgs(node1, body, { useTransportToken: true })
  )
  t.true(typeof add.response === 'object', 'add contact should return object')
  //create node2 id based on the post response
  var node2id = add && add.response && add.response.id
  //check that node2id is a number and therefore exists (contact was posted)
  t.true(typeof node2id === 'number', 'node1id should be a number')

  //await contact_key
  const [n1contactP1, n2contactP1] = await getContactAndCheckKeyExchange(
    t,
    node1,
    node2
  )

  //make sure node 2 has the contact_key
  t.true(
    typeof n2contactP1.contact_key === 'string',
    'node2 should have a contact key'
  )
  t.true(
    typeof n1contactP1 === 'object',
    'node1 should be its own first contact'
  )

  return true
}

interface SendMessageOptions {
  amount: number
}

async function sendMessageAndCheckDecryption(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  text: string,
  options?: SendMessageOptions
): Promise<Message> {
  //NODE1 SENDS TEXT MESSAGE TO NODE2
  const [node1contact, node2contact] = await getContactAndCheckKeyExchange(
    t,
    node1,
    node2
  )

  //encrypt random string with node1 contact_key
  const encryptedText = rsa.encrypt(node1contact.contact_key, text)
  //encrypt random string with node2 contact_key
  const remoteText = rsa.encrypt(node2contact.contact_key, text)
  //create message object with encrypted texts
  const v = {
    contact_id: node2contact.id,
    chat_id: null,
    text: encryptedText,
    remote_text_map: { [node2contact.id]: remoteText },
    amount: (options && options.amount) || 0,
    reply_uuid: '',
    boost: false,
  }

  //send message from node1 to node2
  const msg = await http.post(
    node1.external_ip + '/messages',
    makeArgs(node1, v, { useTransportToken: true })
  )
  //make sure msg exists
  t.true(msg.success, 'msg should exist')
  const msgUuid = msg.response.uuid
  t.truthy(msg.success, msgUuid)
  // //wait for message to process
  const lastMessage = await getCheckNewMsgs(t, node2, msgUuid)
  t.truthy(lastMessage, 'await message post')
  //decrypt the last message sent to node2 using node2 private key and lastMessage content
  const decrypt = rsa.decrypt(node2.privkey, lastMessage.message_content)
  //the decrypted message should equal the random string input before encryption
  t.true(decrypt === text, 'decrypted text should equal pre-encryption text')

  return msg.response
}

function getCheckNewMsgs(
  _t: Assertions,
  node: NodeConfig,
  msgUuid: string
): Promise<Message> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, node, msgUuid, resolve, reject)
    }, 1000)
  })
}

async function timeout(
  i: number,
  node: NodeConfig,
  msgUuid: string,
  resolve,
  reject
) {
  const msgRes = await http.get(
    node.external_ip + '/messages',
    makeArgs(node, {}, { useTransportToken: true })
  )
  if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
    // console.log('===>', msgRes.response.new_messages, msgUuid)
    const lastMessage = msgRes.response.new_messages.find(
      (msg) => msg.uuid === msgUuid
    )
    if (lastMessage) {
      return resolve(lastMessage)
    }
  }
  if (i > 10) {
    return reject('failed to getCheckNewMsgs')
  }
  setTimeout(async () => {
    timeout(i + 1, node, msgUuid, resolve, reject)
  }, 1000)
}
