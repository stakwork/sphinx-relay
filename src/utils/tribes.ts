import * as moment from 'moment'
import * as zbase32 from './zbase32'
import * as LND from '../grpc/lightning'
import * as mqtt from 'mqtt'
import { IClientSubscribeOptions } from 'mqtt'
import fetch from 'node-fetch'
import {
  Contact,
  Chat,
  models,
  sequelize,
  ChatRecord,
  ContactRecord,
} from '../models'
import { makeBotsJSON, declare_bot, delete_bot } from './tribeBots'
import { loadConfig } from './config'
import { isProxy, getProxyXpub } from './proxy'
import { Op } from 'sequelize'
import { logging, sphinxLogger } from './logger'
import type { Tribe } from '../models/ts/tribe'
import { sleep, asyncForEach } from '../helpers'
export { declare_bot, delete_bot }
import { txIndexFromChannelId } from '../grpc/interfaces'

const config = loadConfig()

// {pubkey: {host: Client} }
const clients: { [k: string]: { [k: string]: mqtt.Client } } = {}

const optz: IClientSubscribeOptions = { qos: 0 }

// XPUB RESPONSE FROM PROXY
let XPUB_RES: { xpub: string; pubkey: string } | undefined

// this runs at relay startup
export async function connect(
  onMessage: (topic: string, message: Buffer) => void
): Promise<void> {
  initAndSubscribeTopics(onMessage)
}

export async function getTribeOwnersChatByUUID(uuid: string): Promise<any> {
  const isOwner = isProxy() ? "'t'" : '1'
  try {
    const r = (await sequelize.query(
      `
      SELECT sphinx_chats.* FROM sphinx_chats
      INNER JOIN sphinx_contacts
      ON sphinx_chats.owner_pubkey = sphinx_contacts.public_key
      AND sphinx_contacts.is_owner = ${isOwner}
      AND sphinx_contacts.id = sphinx_chats.tenant
      AND sphinx_chats.uuid = '${uuid}'`,
      {
        model: models.Chat,
        mapToModel: true, // pass true here if you have any mapped fields
      }
    )) as ChatRecord[]
    // console.log('=> getTribeOwnersChatByUUID r:', r)
    return r && r[0] && r[0].dataValues
  } catch (e) {
    sphinxLogger.error(e)
  }
}

async function initializeClient(
  pubkey: string,
  host: string,
  onMessage?: (topic: string, message: Buffer) => void
): Promise<mqtt.Client> {
  return new Promise(async (resolve) => {
    let connected = false
    async function reconnect() {
      try {
        const pwd = await genSignedTimestamp(pubkey)
        if (connected) return
        const url = mqttURL(host)
        const cl = mqtt.connect(url, {
          username: pubkey,
          password: pwd,
          reconnectPeriod: 0, // dont auto reconnect
        })
        sphinxLogger.info(`try to connect: ${url}`, logging.Tribes)
        cl.on('connect', async function () {
          // first check if its already connected to this host (in case it takes a long time)
          connected = true
          if (
            clients[pubkey] &&
            clients[pubkey][host] &&
            clients[pubkey][host].connected
          ) {
            resolve(clients[pubkey][host])
            return
          }
          sphinxLogger.info(`connected!`, logging.Tribes)
          if (!clients[pubkey]) clients[pubkey] = {}
          clients[pubkey][host] = cl // ADD TO MAIN STATE
          cl.on('close', function (e) {
            sphinxLogger.info(`CLOSE ${e}`, logging.Tribes)
            // setTimeout(() => reconnect(), 2000);
            connected = false
            if (clients[pubkey] && clients[pubkey][host]) {
              delete clients[pubkey][host]
            }
          })
          cl.on('error', function (e) {
            sphinxLogger.error(`error:  ${e.message}`, logging.Tribes)
          })
          cl.on('message', function (topic, message) {
            // console.log("============>>>>> GOT A MSG", topic, message)
            if (onMessage) onMessage(topic, message)
          })
          cl.subscribe(`${pubkey}/#`, function (err) {
            if (err)
              sphinxLogger.error(`error subscribing ${err}`, logging.Tribes)
            else {
              sphinxLogger.info(`subscribed! ${pubkey}/#`, logging.Tribes)
              resolve(cl)
            }
          })
        })
      } catch (e) {
        sphinxLogger.error(`error initializing ${e}`, logging.Tribes)
      }
    }
    while (true) {
      if (!connected) {
        reconnect()
      }
      await sleep(5000 + Math.round(Math.random() * 8000))
    }
  })
}

async function lazyClient(
  pubkey: string,
  host: string,
  onMessage?: (topic: string, message: Buffer) => void
): Promise<mqtt.Client> {
  if (
    clients[pubkey] &&
    clients[pubkey][host] &&
    clients[pubkey][host].connected
  ) {
    return clients[pubkey][host]
  }
  const cl = await initializeClient(pubkey, host, onMessage)
  return cl
}

async function initAndSubscribeTopics(
  onMessage: (topic: string, message: Buffer) => void
): Promise<void> {
  const host = getHost()
  try {
    if (isProxy()) {
      if (config.proxy_hd_keys) {
        await proxy_hd_client(onMessage)
      } else {
        const allOwners: Contact[] = (await models.Contact.findAll({
          where: { isOwner: true },
        })) as Contact[]
        if (!(allOwners && allOwners.length)) return
        asyncForEach(allOwners, async (c) => {
          if (c.publicKey && c.publicKey.length === 66) {
            await lazyClient(c.publicKey, host, onMessage)
            await subExtraHostsForTenant(c.id, c.publicKey, onMessage) // 1 is the tenant id on non-proxy
          }
        })
      }
    } else {
      // just me
      const info = await LND.getInfo(false)
      await lazyClient(info.identity_pubkey, host, onMessage)
      updateTribeStats(info.identity_pubkey)
      subExtraHostsForTenant(1, info.identity_pubkey, onMessage) // 1 is the tenant id on non-proxy
    }
  } catch (e) {
    sphinxLogger.error(`TRIBES ERROR ${e}`)
  }
}

async function subExtraHostsForTenant(
  tenant: number,
  pubkey: string,
  onMessage: (topic: string, message: Buffer) => void
) {
  const host = getHost()
  const externalTribes = await models.Chat.findAll({
    where: {
      tenant,
      host: { [Op.ne]: host }, // not the host from config
    },
  })
  if (!(externalTribes && externalTribes.length)) return
  const usedHosts: string[] = []
  externalTribes.forEach(async (et: Chat) => {
    if (usedHosts.includes(et.host)) return
    usedHosts.push(et.host) // dont do it twice
    const client = await lazyClient(pubkey, host, onMessage)
    client.subscribe(`${pubkey}/#`, optz, function (err) {
      if (err) sphinxLogger.error(`subscribe error 2 ${err}`, logging.Tribes)
    })
  })
}

export function printTribesClients(): string {
  const ret = {}
  Object.entries(clients).forEach((entry) => {
    const pk = entry[0]
    const obj = entry[1]
    ret[pk] = {}
    Object.keys(obj).forEach((host) => {
      ret[pk][host] = true
    })
  })
  return JSON.stringify(ret)
}

export async function addExtraHost(
  pubkey: string,
  host: string,
  onMessage: (topic: string, message: Buffer) => void
): Promise<void> {
  // console.log("ADD EXTRA HOST", printTribesClients(), host);
  if (getHost() === host) return // not for default host
  if (clients[pubkey] && clients[pubkey][host]) return // already exists
  const client = await lazyClient(pubkey, host, onMessage)
  client.subscribe(`${pubkey}/#`, optz)
}

function mqttURL(h: string) {
  let host = config.mqtt_host || h
  let protocol = 'tls'
  if (config.tribes_insecure) {
    protocol = 'tcp'
  }
  let port = 8883
  if (config.tribes_mqtt_port) {
    port = config.tribes_mqtt_port
  }
  if (host.includes(':')) {
    const arr = host.split(':')
    host = arr[0]
  }
  return `${protocol}://${host}:${port}`
}

// for proxy, need to get all isOwner contacts and their owned chats
async function updateTribeStats(myPubkey) {
  if (isProxy()) return // skip on proxy for now?
  const myTribes = (await models.Chat.findAll({
    where: {
      ownerPubkey: myPubkey,
      deleted: false,
    },
  })) as Chat[]
  await asyncForEach(myTribes, async (tribe) => {
    try {
      const contactIds = JSON.parse(tribe.contactIds)
      const member_count = (contactIds && contactIds.length) || 0
      await putstats({
        uuid: tribe.uuid,
        host: tribe.host,
        member_count,
        chatId: tribe.id,
        owner_pubkey: myPubkey,
      })
    } catch (e) {
      // dont care about the error
    }
  })
  if (myTribes.length) {
    sphinxLogger.info(
      `updated stats for ${myTribes.length} tribes`,
      logging.Tribes
    )
  }
}

export async function subscribe(
  topic: string,
  onMessage: (topic: string, message: Buffer) => void
): Promise<void> {
  const pubkey = topic.split('/')[0]
  if (pubkey.length !== 66) return
  const host = getHost()
  const client = await lazyClient(pubkey, host, onMessage)
  if (client)
    client.subscribe(topic, function () {
      sphinxLogger.info(`added sub ${host} ${topic}`, logging.Tribes)
    })
}

export async function publish(
  topic: string,
  msg: string,
  ownerPubkey: string,
  cb: () => void
): Promise<void> {
  if (ownerPubkey.length !== 66) return
  const host = getHost()
  const client = await lazyClient(ownerPubkey, host)
  if (client)
    client.publish(topic, msg, optz, function (err) {
      if (err) sphinxLogger.error(`error publishing ${err}`, logging.Tribes)
      else if (cb) cb()
    })
}

// good name? made this because 2 functions used similar object pattern args
export interface TribeInterface {
  uuid: string
  name: string
  description: string
  tags: any[]
  img: string
  group_key?: string
  host: string
  price_per_message: number
  price_to_join: number
  owner_alias: string
  owner_pubkey: string
  escrow_amount: number
  escrow_millis: number
  unlisted: boolean
  is_private: boolean
  app_url: string
  feed_url: string
  feed_type: number
  deleted?: boolean
  owner_route_hint: string
  pin: string
  profile_filters?: string
}

export async function declare({
  uuid,
  name,
  description,
  tags,
  img,
  group_key,
  host,
  price_per_message,
  price_to_join,
  owner_alias,
  owner_pubkey,
  escrow_amount,
  escrow_millis,
  unlisted,
  is_private,
  app_url,
  feed_url,
  feed_type,
  owner_route_hint,
  pin,
  profile_filters,
}: TribeInterface): Promise<void> {
  try {
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/tribes', {
      method: 'POST',
      body: JSON.stringify({
        uuid,
        group_key,
        name,
        description,
        tags,
        img: img || '',
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        owner_alias,
        owner_pubkey,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        unlisted: unlisted || false,
        private: is_private || false,
        app_url: app_url || '',
        feed_url: feed_url || '',
        feed_type: feed_type || 0,
        owner_route_hint: owner_route_hint || '',
        pin: pin || '',
        profile_filters,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to create tribe ' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    sphinxLogger.error(`unauthorized to declare`, logging.Tribes)
    throw e
  }
}

export async function edit({
  uuid,
  host,
  name,
  description,
  tags,
  img,
  price_per_message,
  price_to_join,
  owner_alias,
  escrow_amount,
  escrow_millis,
  unlisted,
  is_private,
  app_url,
  feed_url,
  feed_type,
  deleted,
  owner_route_hint,
  owner_pubkey,
  pin,
  profile_filters,
}: TribeInterface): Promise<void> {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/tribe?token=' + token, {
      method: 'PUT',
      body: JSON.stringify({
        uuid,
        name,
        description,
        tags,
        img: img || '',
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
        feed_type: feed_type || 0,
        owner_route_hint: owner_route_hint || '',
        pin: pin || '',
        profile_filters,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to edit tribe ' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    sphinxLogger.error(`unauthorized to edit`, logging.Tribes)
    throw e
  }
}

export async function delete_tribe(
  uuid: string,
  owner_pubkey: string
): Promise<void> {
  const host = getHost()
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(
      `${protocol}://${host}/tribe/${uuid}?token=${token}`,
      {
        method: 'DELETE',
      }
    )
    if (!r.ok) {
      throw 'failed to delete tribe ' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    sphinxLogger.error(`unauthorized to delete`, logging.Tribes)
    throw e
  }
}

export async function get_tribe_data(uuid: string): Promise<Tribe> {
  const host = getHost()
  try {
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(`${protocol}://${host}/tribes/${uuid}`)
    if (!r.ok) {
      throw 'failed to get tribe ' + r.status
    }
    const j = await r.json()
    return j
  } catch (e) {
    sphinxLogger.error(`couldnt get tribe`, logging.Tribes)
    throw e
  }
}

export async function putActivity(
  uuid: string,
  host: string,
  owner_pubkey: string
): Promise<void> {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    await fetch(`${protocol}://${host}/tribeactivity/${uuid}?token=` + token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    sphinxLogger.error(`unauthorized to putActivity`, logging.Tribes)
    throw e
  }
}

export async function putstats({
  uuid,
  host,
  member_count,
  chatId,
  owner_pubkey,
}: {
  uuid: string
  host: string
  member_count: number
  chatId: number
  owner_pubkey: string
}): Promise<void> {
  if (!uuid) return
  const bots = await makeBotsJSON(chatId)
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    await fetch(protocol + '://' + host + '/tribestats?token=' + token, {
      method: 'PUT',
      body: JSON.stringify({
        uuid,
        member_count,
        bots: JSON.stringify(bots || []),
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    sphinxLogger.error(`unauthorized to putstats`, logging.Tribes)
    throw e
  }
}

export async function createChannel({
  tribe_uuid,
  host,
  name,
  owner_pubkey,
}: {
  tribe_uuid: string
  host: string
  name: string
  owner_pubkey: string
}) {
  if (!tribe_uuid) return
  if (!name) return
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/channel?token=' + token, {
      method: 'POST',
      body: JSON.stringify({
        tribe_uuid,
        name,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to create tribe channel ' + r.status
    }
    const j = await r.json()
    return j
  } catch (e) {
    sphinxLogger.error(`unauthorized to create channel`, logging.Tribes)
    throw e
  }
}

export async function deleteChannel({
  id,
  host,
  owner_pubkey,
}: {
  id: number
  host: string
  owner_pubkey: string
}) {
  if (!id) return
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(
      protocol + '://' + host + '/channel/' + id + '?token=' + token,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!r.ok) {
      throw 'failed to delete channel' + r.status
    }
    const j = await r.json()
    return j
  } catch (e) {
    sphinxLogger.error(`unauthorized to create channel`, logging.Tribes)
    throw e
  }
}

export async function genSignedTimestamp(ownerPubkey: string): Promise<string> {
  // console.log('genSignedTimestamp')
  const now = moment().unix()
  const tsBytes = Buffer.from(now.toString(16), 'hex')
  const sig = await LND.signBuffer(tsBytes, ownerPubkey)
  const sigBytes = zbase32.decode(sig)
  const totalLength = tsBytes.length + sigBytes.length
  const buf = Buffer.concat([tsBytes, sigBytes], totalLength)
  return urlBase64(buf)
}

export async function verifySignedTimestamp(
  stsBase64: string
): Promise<string | undefined> {
  const stsBuf = Buffer.from(stsBase64, 'base64')
  const sig = stsBuf.subarray(4, 92)
  const sigZbase32 = zbase32.encode(sig)
  const r = await LND.verifyBytes(stsBuf.subarray(0, 4), sigZbase32) // sig needs to be zbase32 :(
  if (r.valid) {
    return r.pubkey
  }
}

export function getHost(): string {
  return config.tribes_host || ''
}

function urlBase64(buf: Buffer): string {
  return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
}

function proxy_hd_client(
  onMessage?: (topic: string, message: Buffer) => void
): Promise<mqtt.Client> {
  return new Promise(async (resolve) => {
    let connected = false
    async function reconnect() {
      try {
        const host = getHost()
        const xpub_res = await getProxyXpub()

        if (!xpub_res?.xpub || !xpub_res?.pubkey) {
          throw 'Could not get xpub key or pubkey'
        }
        XPUB_RES = xpub_res
        const xpub = xpub_res.xpub
        const pubkey = xpub_res.pubkey
        // console.log(pubkey)
        const pwd = await genSignedTimestamp(pubkey)
        if (connected) return
        const url = mqttURL(host)
        const cl = mqtt.connect(url, {
          username: xpub,
          password: pwd,
          reconnectPeriod: 0, // dont auto reconnect
        })
        sphinxLogger.info(`try to connect: ${url}`, logging.Tribes)
        cl.on('connect', async function () {
          // first check if its already connected to this host (in case it takes a long time)
          connected = true
          if (
            clients[xpub] &&
            clients[xpub][host] &&
            clients[xpub][host].connected
          ) {
            resolve(clients[xpub][host])
            return
          }
          sphinxLogger.info(`connected!`, logging.Tribes)
          if (!clients[xpub]) clients[xpub] = {}
          clients[xpub][host] = cl // ADD TO MAIN STATE
          cl.on('close', function (e) {
            sphinxLogger.info(`CLOSE ${e}`, logging.Tribes)
            // setTimeout(() => reconnect(), 2000);
            connected = false
            if (clients[xpub] && clients[xpub][host]) {
              delete clients[xpub][host]
            }
          })
          cl.on('error', function (e) {
            sphinxLogger.error(`error:  ${e.message}`, logging.Tribes)
          })
          cl.on('message', function (topic, message) {
            // console.log("============>>>>> GOT A MSG", topic, message)
            if (onMessage) onMessage(topic, message)
          })
          const allOwners: Contact[] = (await models.Contact.findAll({
            where: { isOwner: true, id: { [Op.not]: 1 } },
          })) as Contact[]

          if (!(allOwners && allOwners.length)) return

          asyncForEach(allOwners, async (c) => {
            try {
              if (c.publicKey && c.publicKey.length === 66) {
                let routeHint = c.routeHint
                if (!routeHint) {
                  throw `Invalid route hint: ${c.routeHint}`
                }
                const index = await txIndexFromChannelId(
                  parseRouteHint(routeHint)
                )

                await hdSubscribe(c.publicKey, index, cl)
              }
            } catch (error) {
              sphinxLogger.error([`error ${error}`, logging.Tribes])
            }
          })
        })
        await subscribeProxyRootTenant(host, onMessage)
      } catch (error) {
        sphinxLogger.error([`error initializing ${error}`, logging.Tribes])
      }
    }
    while (true) {
      if (!connected) {
        reconnect()
      }
      await sleep(5000 + Math.round(Math.random() * 8000))
    }
  })
}

async function hdSubscribe(pubkey: string, index: number, client: mqtt.Client) {
  try {
    await subscribeAndCheck(client, `${pubkey}/#`)
  } catch (e) {
    try {
      console.log('=> first time connect')
      await subscribeAndCheck(client, `${pubkey}/INDEX_${index}`)
      await subscribeAndCheck(client, `${pubkey}/#`)
    } catch (error) {
      console.log(error)
      sphinxLogger.error([`error subscribing`, error, logging.Tribes])
    }
  }
}

function subscribeAndCheck(client: mqtt.Client, topic: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      client.subscribe(topic, function (err, granted) {
        if (!err) {
          const qos = granted && granted[0] && granted[0].qos
          // https://github.com/mqttjs/MQTT.js/pull/351
          if ([0, 1, 2].includes(qos)) {
            sphinxLogger.info(`subscribed! ${granted[0].topic}`, logging.Tribes)
            resolve()
          } else {
            reject(`Could not subscribe topic: ${topic}`)
          }
        } else {
          console.log(err)
          sphinxLogger.error([`error subscribing`, err], logging.Tribes)
          reject()
        }
      })
    } catch (error) {
      console.log(error)
      reject()
    }
  })
}

async function subscribeProxyRootTenant(
  host: string,
  onMessage?: (topic: string, message: Buffer) => void
) {
  try {
    const nonProxyTenant = (await models.Contact.findOne({
      where: { isOwner: true, id: 1 },
    })) as ContactRecord
    console.log(nonProxyTenant.dataValues)
    await lazyClient(nonProxyTenant.publicKey, host, onMessage)
  } catch (error) {
    throw 'Error subscribing proxy root tenant'
  }
}

export async function addNewSubscriptionForProxy(owner: Contact) {
  try {
    if (XPUB_RES) {
      const host = getHost()
      if (
        clients[XPUB_RES.xpub] &&
        clients[XPUB_RES.xpub][host] &&
        clients[XPUB_RES.xpub][host].connected
      ) {
        const client = clients[XPUB_RES.xpub][host]
        if (!owner.routeHint) {
          throw `Invalid route hint: ${owner.routeHint}`
        }
        const index = await txIndexFromChannelId(
          parseRouteHint(owner.routeHint)
        )
        await hdSubscribe(owner.publicKey, index, client)
      } else {
        throw 'MQTT Client was not found'
      }
    } else {
      throw 'XPUB is not available'
    }
  } catch (error) {
    sphinxLogger.error([error, logging.Tribes])
  }
}

function parseRouteHint(routeHint) {
  return routeHint.substring(routeHint.indexOf(':') + 1, routeHint.length)
}
