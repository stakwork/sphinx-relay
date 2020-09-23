
import * as moment from 'moment'
import * as zbase32 from './zbase32'
import * as LND from './lightning'
import * as path from 'path'
import * as mqtt from 'mqtt'
import fetch from 'node-fetch'
import { models } from '../models'
import {makeBotsJSON, declare_bot} from './tribeBots'

export {declare_bot}

const env = process.env.NODE_ENV || 'development'
const config = require(path.join(__dirname, '../../config/app.json'))[env]

let client: any

export async function connect(onMessage) {
  try {
    const info = await LND.getInfo()

    async function reconnect() {
      client = null
      const pwd = await genSignedTimestamp()
      console.log('[tribes] try to connect:', `tls://${config.tribes_host}:8883`)
      client = mqtt.connect(`tls://${config.tribes_host}:8883`, {
        username: info.identity_pubkey,
        password: pwd,
        reconnectPeriod: 0, // dont auto reconnect
      })
      client.on('connect', async function () {
        console.log("[tribes] connected!")
        client.subscribe(`${info.identity_pubkey}/#`)
        updateTribeStats(info.identity_pubkey)
        const rndToken = await genSignedTimestamp()
        console.log('=> random sig', rndToken)
      })
      client.on('close', function (e) {
        setTimeout(() => reconnect(), 2000)
      })
      client.on('error', function (e) {
        console.log('[tribes] error: ', e.message || e)
      })
      client.on('message', function (topic, message) {
        if (onMessage) onMessage(topic, message)
      })
    }
    reconnect()

  } catch (e) {
    console.log("TRIBES ERROR", e)
  }
}

async function updateTribeStats(myPubkey) {
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
  console.log(`[tribes] updated stats for ${myTribes.length} tribes`)
}

export function subscribe(topic) {
  if (client) client.subscribe(topic)
}

export function publish(topic, msg, cb) {
  if (client) client.publish(topic, msg, null, function (err) {
    if (err) console.log(err)
    else if (cb) cb()
  })
}

export async function declare({ uuid, name, description, tags, img, group_key, host, price_per_message, price_to_join, owner_alias, owner_pubkey, escrow_amount, escrow_millis, unlisted, is_private, app_url }) {
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
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    // const j = await r.json()
  } catch (e) {
    console.log('[tribes] unauthorized to declare')
    throw e
  }
}

export async function edit({ uuid, host, name, description, tags, img, price_per_message, price_to_join, owner_alias, escrow_amount, escrow_millis, unlisted, is_private, app_url, deleted }) {
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
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    // const j = await r.json()
  } catch (e) {
    console.log('[tribes] unauthorized to edit')
    throw e
  }
}

export async function delete_tribe({ uuid }) {
  const host = getHost()
  try {
    const token = await genSignedTimestamp()
    console.log('=> delete_tribe', `https://${host}/tribe/${uuid}?token=${token}`)
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

export async function genSignedTimestamp() {
  const now = moment().unix()
  const tsBytes = Buffer.from(now.toString(16), 'hex')
  const sig = await LND.signBuffer(tsBytes)
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