
import * as moment from 'moment'
import * as zbase32 from './zbase32'
import * as LND from './lightning'
import * as mqtt from 'mqtt'
import {IClientSubscribeOptions} from 'mqtt'
import fetch from 'node-fetch'
import { models, sequelize } from '../models'
import { makeBotsJSON, declare_bot } from './tribeBots'
import { loadConfig } from './config'
import { isProxy } from './proxy'

export { declare_bot }

const config = loadConfig()

let clients: {[k:string]: mqtt.Client} = {}

export async function getTribeOwnersChatByUUID(uuid: string) {
  try {
    const r = await sequelize.query(`SELECT * from sphinx_chats
      INNER JOIN sphinx_contacts
      ON sphinx_chats.owner_pubkey = sphinx_contacts.public_key
      AND sphinx_chats.tenant = sphinx_contacts.tenant
      AND sphinx_chats.uuid = '${uuid}'`, {
      model: models.Chat,
      mapToModel: true // pass true here if you have any mapped fields
    })
    return r && r[0] && r[0].dataValues
  } catch (e) { console.log(e) }
}

async function initializeClient(pubkey, onMessage): Promise<mqtt.Client> {
  return new Promise((resolve,reject)=>{
    async function reconnect() {
      const pwd = await genSignedTimestamp(pubkey)
      const cl = mqtt.connect(mqttURL(), {
        username: pubkey,
        password: pwd,
        reconnectPeriod: 0, // dont auto reconnect
      })
      clients[pubkey] = cl
      console.log('[tribes] try to connect:', mqttURL())
      cl.on('connect', async function () {
        console.log("[tribes] connected!")
        cl.subscribe(pubkey+'/#')
        resolve(cl)
      })
      cl.on('close', function (e) {
        setTimeout(() => reconnect(), 2000)
      })
      cl.on('error', function (e) {
        console.log('[tribes] error: ', e.message || e)
      })
      cl.on('message', function (topic, message) {
        if (onMessage) onMessage(topic, message)
      })
    }
    reconnect()
  })
}

async function lazyClient(pubkey:string, onMessage?:Function) {
  if(clients[pubkey]) return clients[pubkey]
  const cl = await initializeClient(pubkey, onMessage)
  return cl
}

async function subscribeTopics(onMessage) {
  try {
    if (isProxy()) {
      const allOwners = await models.Contact.findAll({ where: { isOwner: true } })
      if (!(allOwners && allOwners.length)) return
      allOwners.forEach(async c=> {
        if (c.id === 1) return // the proxy non user
        if (c.publicKey && c.publicKey.length === 66) {
          const opts: IClientSubscribeOptions = {
            qos: 0
          }
          const client = await lazyClient(c.publicKey, onMessage)
          client.subscribe(`${c.publicKey}/#`, opts, function(err){
            if(err) console.log("[tribes] subscribe error", err)
          })
        }
      })
    } else { // just me
      const info = await LND.getInfo(false)
      const client = await lazyClient(info.identity_pubkey, onMessage)
      client.subscribe(`${info.identity_pubkey}/#`)
      updateTribeStats(info.identity_pubkey)
    }
  } catch(e) {
    console.log("TRIBES ERROR", e)
  }
}

// if host includes colon, remove it
function mqttURL(){
  let host = config.tribes_host
  if(host.includes(':')) {
    const arr = host.split(':')
    host = arr[0]
  }
  let port = '8883'
  let protocol = 'tls'
  if(config.tribes_mqtt_port) {
    port = config.tribes_mqtt_port
  }
  if(config.tribes_protocol) {
    protocol = config.tribes_protocol
  }
  return `${protocol}://${host}:${port}`
}

export async function connect(onMessage) {
  subscribeTopics(onMessage)
}

// for proxy, need to get all isOwner contacts and their owned chats
async function updateTribeStats(myPubkey) {
  if (isProxy()) return // skip on proxy for now?
  const myTribes = await models.Chat.findAll({
    where: {
      ownerPubkey: myPubkey
    }
  })
  await asyncForEach(myTribes, async (tribe) => {
    try {
      const contactIds = JSON.parse(tribe.contactIds)
      const member_count = (contactIds && contactIds.length) || 0
      await putstats({ uuid: tribe.uuid, host: tribe.host, member_count, chatId: tribe.id })
    } catch (e) { }
  })
  if (myTribes.length) {
    console.log(`[tribes] updated stats for ${myTribes.length} tribes`)
  }
}

export async function subscribe(topic) {
  const pubkey = topic.split('/')[0]
  if(pubkey.length!==66) return
  const client = await lazyClient(pubkey)
  if (client) client.subscribe(topic)
}

export async function publish(topic, msg, cb) {
  const pubkey = topic.split('/')[0]
  if(pubkey.length!==66) return
  const client = await lazyClient(pubkey)
  const opts: IClientSubscribeOptions = {
    qos: 0
  }
  if (client) client.publish(topic, msg, opts, function (err) {
    if (err) console.log(err)
    else if (cb) cb()
  })
}

export async function declare({ uuid, name, description, tags, img, group_key, host, price_per_message, price_to_join, owner_alias, owner_pubkey, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, owner_route_hint }) {
  try {
    await fetch('https://' + host + '/tribes', {
      method: 'POST',
      body: JSON.stringify({
        uuid, group_key,
        name, description, tags, img: img || '',
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        owner_alias, owner_pubkey,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        unlisted: unlisted || false,
        private: is_private || false,
        app_url: app_url || '',
        feed_url: feed_url || '',
        owner_route_hint: owner_route_hint || ''
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    // const j = await r.json()
  } catch (e) {
    console.log('[tribes] unauthorized to declare')
    throw e
  }
}

export async function edit({ uuid, host, name, description, tags, img, price_per_message, price_to_join, owner_alias, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, deleted, owner_route_hint }) {
  try {
    const token = await genSignedTimestamp()
    await fetch('https://' + host + '/tribe?token=' + token, {
      method: 'PUT',
      body: JSON.stringify({
        uuid,
        name, description, tags, img: img || '',
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        owner_alias,
        unlisted: unlisted || false,
        private: is_private || false,
        deleted: deleted || false,
        app_url: app_url || '',
        feed_url: feed_url || '',
        owner_route_hint: owner_route_hint || ''
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    // const j = await r.json()
  } catch (e) {
    console.log('[tribes] unauthorized to edit')
    throw e
  }
}

export async function delete_tribe(uuid) {
  const host = getHost()
  try {
    const token = await genSignedTimestamp()
    await fetch(`https://${host}/tribe/${uuid}?token=${token}`, {
      method: 'DELETE',
    })
    // const j = await r.json()
  } catch (e) {
    console.log('[tribes] unauthorized to delete')
    throw e
  }
}

export async function putActivity(uuid: string, host: string) {
  try {
    const token = await genSignedTimestamp()
    await fetch(`https://${host}/tribeactivity/${uuid}?token=` + token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.log('[tribes] unauthorized to putActivity')
    throw e
  }
}

export async function putstats({ uuid, host, member_count, chatId }) {
  if (!uuid) return
  const bots = await makeBotsJSON(chatId)
  try {
    const token = await genSignedTimestamp()
    await fetch('https://' + host + '/tribestats?token=' + token, {
      method: 'PUT',
      body: JSON.stringify({
        uuid, member_count, bots: JSON.stringify(bots || [])
      }),
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.log('[tribes] unauthorized to putstats')
    throw e
  }
}

export async function genSignedTimestamp(ownerPubkey?: string) {
  // console.log('genSignedTimestamp')
  const now = moment().unix()
  const tsBytes = Buffer.from(now.toString(16), 'hex')
  const sig = await LND.signBuffer(tsBytes, ownerPubkey)
  const sigBytes = zbase32.decode(sig)
  const totalLength = tsBytes.length + sigBytes.length
  const buf = Buffer.concat([tsBytes, sigBytes], totalLength)
  return urlBase64(buf)
}

export async function verifySignedTimestamp(stsBase64) {
  const stsBuf = Buffer.from(stsBase64, 'base64')
  const sig = stsBuf.subarray(4, 92)
  const sigZbase32 = zbase32.encode(sig)
  const r = await LND.verifyBytes(stsBuf.subarray(0, 4), sigZbase32) // sig needs to be zbase32 :(
  if (r.valid) {
    return r.pubkey
  } else {
    return false
  }
}

export function getHost() {
  return config.tribes_host || ''
}

function urlBase64(buf) {
  return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}