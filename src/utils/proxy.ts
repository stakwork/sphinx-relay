import * as fs from 'fs'
import * as grpc from '@grpc/grpc-js'
import { loadProto } from '../grpc/proto'
import { LightningClient as ProxyLightningClient } from '../grpc/types/lnrpc_proxy/Lightning'
import { loadConfig } from './config'
import * as Lightning from '../grpc/lightning'
import { models, ContactRecord } from '../models'
import fetch from 'node-fetch'
import { logging, sphinxLogger } from './logger'
import { sleep } from '../helpers'
import { Op } from 'sequelize'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost'

const check_proxy_balance = false

export function isProxy(client: any): client is ProxyLightningClient
export function isProxy(): boolean
export function isProxy(client?: any): boolean {
  return config.proxy_lnd_port &&
    config.proxy_macaroons_dir &&
    config.proxy_tls_location
    ? true
    : false
}

export function genUsersInterval(ms) {
  if (!isProxy()) return
  setTimeout(() => {
    // so it starts a bit later than pingHub
    setInterval(generateNewUsers, ms)
  }, 2000)
}

const NEW_USER_NUM =
  config.proxy_new_nodes || config.proxy_new_nodes === 0
    ? config.proxy_new_nodes
    : 2
let SATS_PER_USER = config.proxy_initial_sats
if (!(SATS_PER_USER || SATS_PER_USER === 0)) SATS_PER_USER = 5000

// isOwner users with no authToken
export async function generateNewUsers() {
  if (!isProxy()) {
    sphinxLogger.error(`not proxy`, logging.Proxy)
    return
  }
  const newusers = await models.Contact.findAll({
    where: { isOwner: true, authToken: null, id: { [Op.ne]: 1 } },
  })
  if (newusers.length >= NEW_USER_NUM) {
    sphinxLogger.info(`already have new users`, logging.Proxy)
    return // we already have the mimimum
  }
  const n1 = NEW_USER_NUM - newusers.length
  let n // the number of new users to create
  if (check_proxy_balance) {
    const virtualBal = await getProxyTotalBalance()
    sphinxLogger.info(`total balance ${virtualBal}`, logging.Proxy)
    const realBal = await getProxyLNDBalance()
    sphinxLogger.info(`LND balance ${virtualBal}`, logging.Proxy)

    let availableBalance = realBal - virtualBal
    if (availableBalance < SATS_PER_USER) availableBalance = 1
    const n2 = Math.floor(availableBalance / SATS_PER_USER)
    const n = Math.min(n1, n2)

    if (!n) {
      sphinxLogger.error(`not enough sats`, logging.Proxy)
      return
    }
  } else {
    n = n1
  }
  sphinxLogger.info(`gen new users: ${n}`, logging.Proxy)

  const arr = new Array(n)
  const rootpk = await getProxyRootPubkey()
  await asyncForEach(arr, async () => {
    await generateNewUser(rootpk, SATS_PER_USER)
  })
}

const adminURL = config.proxy_admin_url
  ? config.proxy_admin_url + '/'
  : 'http://localhost:5555/'
export async function generateNewUser(
  rootpk: string,
  initial_sat?: number
): Promise<any> {
  try {
    let route = 'generate'
    if (initial_sat || initial_sat === 0) {
      route = `generate?sats=${initial_sat}`
      sphinxLogger.info(`new user with sats: ${initial_sat}`, logging.Proxy)
    }
    const r = await fetch(adminURL + route, {
      method: 'POST',
      headers: { 'x-admin-token': config.proxy_admin_token },
    })

    const j = await r.json()

    const contact = {
      publicKey: j.pubkey,
      routeHint: `${rootpk}:${j.channel}`,
      isOwner: true,
      authToken: null,
    }
    const created: ContactRecord = (await models.Contact.create(
      contact
    )) as ContactRecord
    // set tenant to self!
    created.update({ tenant: created.id })
    sphinxLogger.info(`=> CREATED OWNER: ${created.dataValues.publicKey}`)
    return created.dataValues
  } catch (e) {
    // sphinxLogger.error(`=> could not gen new user ${e}`)
  }
}

export async function generateNewExternalUser(pubkey: string, sig: string) {
  try {
    const r = await fetch(adminURL + 'create_external', {
      method: 'POST',
      body: JSON.stringify({ pubkey, sig }),
      headers: { 'x-admin-token': config.proxy_admin_token },
    })
    const j = await r.json()
    const rootpk = await getProxyRootPubkey()
    return {
      publicKey: j.pubkey,
      routeHint: `${rootpk}:${j.channel}`,
    }
  } catch (e) {
    sphinxLogger.error(`=> could not gen new external user ${e}`)
  }
}

// "total" is in msats
export async function getProxyTotalBalance() {
  try {
    const r = await fetch(adminURL + 'balances', {
      method: 'GET',
      headers: { 'x-admin-token': config.proxy_admin_token },
    })
    const j = await r.json()
    return j.total ? Math.floor(j.total / 1000) : 0
  } catch (e) {
    return 0
  }
}

export async function loadProxyCredentials(macPrefix: string) {
  for (let i = 0; i < 100 && !fs.existsSync(config.proxy_tls_location); i++) {
    console.log('lndCert not found trying again:')
    await sleep(10000)
  }
  const lndCert = fs.readFileSync(config.proxy_tls_location)
  const sslCreds = grpc.credentials.createSsl(lndCert)
  const m = fs.readFileSync(
    config.proxy_macaroons_dir + '/' + macPrefix + '.macaroon'
  )

  const macaroon = m.toString('hex')
  const metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon)
  const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
    (_args, callback) => {
      callback(null, metadata)
    }
  )

  return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds)
}

export async function loadProxyLightning(
  ownerPubkey?: string
): Promise<ProxyLightningClient | undefined> {
  try {
    let macname
    if (ownerPubkey && ownerPubkey.length === 66) {
      macname = ownerPubkey
    } else {
      try {
        macname = await getProxyRootPubkey()
      } catch (e) {
        //do nothing here
      }
    }
    const credentials = await loadProxyCredentials(macname)
    const lnrpcDescriptor = loadProto('rpc_proxy')
    const lnrpc = lnrpcDescriptor.lnrpc_proxy
    return new lnrpc.Lightning(
      PROXY_LND_IP + ':' + config.proxy_lnd_port,
      credentials
    )
  } catch (e) {
    sphinxLogger.error(`ERROR in loadProxyLightning ${e}`)
  }
}

let proxyRootPubkey = ''

export function getProxyRootPubkey(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (proxyRootPubkey) {
      resolve(proxyRootPubkey)
      return
    }
    // normal client, to get pubkey of LND
    const credentials = Lightning.loadCredentials()
    const lnrpcDescriptor = loadProto('lightning')
    const lnrpc = lnrpcDescriptor.lnrpc
    const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials)
    lc.getInfo({}, function (err, response) {
      if (err == null && response) {
        proxyRootPubkey = response.identity_pubkey
        resolve(proxyRootPubkey)
      } else {
        reject('CANT GET ROOT KEY')
      }
    })
  })
}

function getProxyLNDBalance(): Promise<number> {
  return new Promise((resolve, reject) => {
    // normal client, to get pubkey of LND
    const credentials = Lightning.loadCredentials()
    const lnrpcDescriptor = loadProto('lightning')
    const lnrpc = lnrpcDescriptor.lnrpc
    const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials)
    lc.channelBalance({}, function (err, response) {
      if (err == null && response) {
        lc.listChannels({}, function (err, channelList) {
          if (err == null && channelList) {
            const { channels } = channelList
            const reserve = channels.reduce(
              (a, chan) => a + parseInt(chan.local_chan_reserve_sat),
              0
            )
            const balance = parseInt(response.balance) - reserve
            resolve(balance)
          } else {
            reject(err)
          }
        })
      } else {
        reject(err)
      }
    })
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export async function getProxyXpub() {
  try {
    const r = await fetch(adminURL + 'origin_xpub', {
      method: 'GET',
      headers: { 'x-admin-token': config.proxy_admin_token },
    })
    const j = await r.json()
    return j
  } catch (e) {
    console.log(e)
    throw e
  }
}
