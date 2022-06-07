import * as ByteBuffer from 'bytebuffer'
import * as fs from 'fs'
import * as grpc from 'grpc'
import { sleep } from '../helpers'
import * as sha from 'js-sha256'
import * as crypto from 'crypto'
import constants from '../constants'
import { getMacaroon } from '../utils/macaroon'
import { loadConfig } from '../utils/config'
import { isProxy, loadProxyLightning } from '../utils/proxy'
import { logging, sphinxLogger } from '../utils/logger'
import * as interfaces from './interfaces'
import * as zbase32 from '../utils/zbase32'
import * as secp256k1 from 'secp256k1'
import libhsmd from './libhsmd'
import { get_greenlight_grpc_uri } from './greenlight'
import { Req } from '../types'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
// const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'

export const LND_KEYSEND_KEY = 5482373484
export const SPHINX_CUSTOM_RECORD_KEY = 133773310

const FEE_LIMIT_SAT = 10000

type LightningClient = any // for now
let lightningClient: LightningClient

export function loadCredentials(macName?: string): grpc.ChannelCredentials {
  try {
    const lndCert = fs.readFileSync(config.tls_location)
    const sslCreds = grpc.credentials.createSsl(lndCert)
    const macaroon = getMacaroon(macName)
    const metadata = new grpc.Metadata()
    metadata.add('macaroon', macaroon)
    const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
      (_args, callback) => {
        callback(null, metadata)
      }
    )

    return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds)
  } catch (e) {
    // console.log(e)
    throw 'cannot read LND macaroon or cert'
  }
}

const loadGreenlightCredentials = () => {
  const glCert = fs.readFileSync(config.tls_location)
  const glPriv = fs.readFileSync(config.tls_key_location)
  const glChain = fs.readFileSync(config.tls_chain_location)
  return grpc.credentials.createSsl(glCert, glPriv, glChain)
}

export async function loadLightning(
  tryProxy?: boolean,
  ownerPubkey?: string,
  noCache?: boolean
): Promise<any> {
  // only if specified AND available
  if (tryProxy && isProxy() && ownerPubkey) {
    const pl = await loadProxyLightning(ownerPubkey)
    return pl
  }
  if (lightningClient && !noCache) {
    return lightningClient
  }

  if (IS_GREENLIGHT) {
    const credentials = loadGreenlightCredentials()
    const descriptor = grpc.load('proto/greenlight.proto')
    const greenlight: any = descriptor.greenlight
    const options = {
      'grpc.ssl_target_name_override': 'localhost',
    }
    const uri = get_greenlight_grpc_uri().split('//')
    if (!uri[1]) return
    lightningClient = new greenlight.Node(uri[1], credentials, options)
    return lightningClient
  }

  // LND
  const credentials = loadCredentials()
  const lnrpcDescriptor = grpc.load('proto/rpc.proto')
  const lnrpc: any = lnrpcDescriptor.lnrpc
  lightningClient = new lnrpc.Lightning(
    LND_IP + ':' + config.lnd_port,
    credentials
  )
  return lightningClient
}

export function loadWalletUnlocker(): any {
  if (walletUnlocker) {
    return walletUnlocker
  } else {
    try {
      const credentials = loadCredentials()
      const lnrpcDescriptor = grpc.load('proto/walletunlocker.proto')
      const lnrpc: any = lnrpcDescriptor.lnrpc
      walletUnlocker = new lnrpc.WalletUnlocker(
        LND_IP + ':' + config.lnd_port,
        credentials
      )
      return walletUnlocker
    } catch (e) {
      sphinxLogger.error(e)
    }
  }
}

export function unlockWallet(pwd: string): Promise<void> {
  return new Promise(async function (resolve, reject) {
    const wu = await loadWalletUnlocker()
    wu.unlockWallet(
      { wallet_password: ByteBuffer.fromUTF8(pwd) },
      (err, response) => {
        if (err) {
          reject(err)
          return
        }
        resolve(response)
      }
    )
  })
}

export function getHeaders(req: Req): { [k: string]: any } {
  return {
    'X-User-Token': req.headers['x-user-token'],
    'X-User-Email': req.headers['x-user-email'],
  }
}

let isLocked = false
let lockTimeout: ReturnType<typeof setTimeout>
export function getLock(): boolean {
  return isLocked
}
export function setLock(value: boolean): void {
  isLocked = value
  sphinxLogger.info({ isLocked })
  if (lockTimeout) clearTimeout(lockTimeout)
  lockTimeout = setTimeout(() => {
    isLocked = false
    sphinxLogger.info({ isLocked })
  }, 1000 * 60 * 2)
}

interface QueryRouteResponse {
  success_prob: number
  routes: interfaces.Route[]
}
export async function queryRoute(
  pub_key: string,
  amt: number,
  route_hint?: string,
  ownerPubkey?: string
): Promise<QueryRouteResponse> {
  sphinxLogger.info('queryRoute', logging.Lightning)
  if (IS_GREENLIGHT) {
    // shim for now
    return {
      success_prob: 1,
      routes: [],
    }
  }
  const lightning = await loadLightning(true, ownerPubkey) // try proxy
  return new Promise((resolve, reject) => {
    const options: { [k: string]: any } = { pub_key, amt }
    if (route_hint && route_hint.includes(':')) {
      const arr = route_hint.split(':')
      const node_id = arr[0]
      const chan_id = arr[1]
      options.route_hints = [
        {
          hop_hints: [{ node_id, chan_id }],
        },
      ]
    }
    lightning.queryRoutes(options, (err, response) => {
      if (err) {
        reject(err)
        return
      }
      resolve(response)
    })
  })
}

export const WITNESS_PUBKEY_HASH = 0
export const NESTED_PUBKEY_HASH = 1
export const UNUSED_WITNESS_PUBKEY_HASH = 2
export const UNUSED_NESTED_PUBKEY_HASH = 3
export type NewAddressType = 0 | 1 | 2 | 3
export async function newAddress(
  type: NewAddressType = NESTED_PUBKEY_HASH
): Promise<string> {
  const lightning = await loadLightning()
  return new Promise((resolve, reject) => {
    lightning.newAddress({ type }, (err, response) => {
      if (err) {
        reject(err)
        return
      }
      if (!(response && response.address)) {
        reject('no address')
        return
      }
      resolve(response.address)
    })
  })
}

// for paying invoice and invite invoice
export async function sendPayment(
  payment_request: string,
  ownerPubkey?: string
): Promise<interfaces.SendPaymentResponse> {
  sphinxLogger.info('sendPayment', logging.Lightning)
  const lightning = await loadLightning(true, ownerPubkey) // try proxy
  return new Promise((resolve, reject) => {
    if (isProxy()) {
      const opts = {
        payment_request,
        fee_limit: { fixed: FEE_LIMIT_SAT },
      }
      lightning.sendPaymentSync(opts, (err, response) => {
        if (err) {
          reject(err)
        } else {
          if (response.payment_error) {
            reject(response.payment_error)
          } else {
            resolve(response)
          }
        }
      })
    } else {
      if (IS_GREENLIGHT) {
        lightning.pay(
          {
            bolt11: payment_request,
            timeout: 12,
          },
          (err, response) => {
            if (err == null) {
              resolve(interfaces.keysendResponse(response))
            } else {
              reject(err)
            }
          }
        )
      } else {
        const call = lightning.sendPayment({ payment_request })
        call.on('data', async (response) => {
          if (response.payment_error) {
            reject(response.payment_error)
          } else {
            resolve(response)
          }
        })
        call.on('error', async (err) => {
          reject(err)
        })
        call.write({ payment_request })
      }
    }
  })
}

export interface KeysendOpts {
  amt: number
  dest: string
  data?: string
  route_hint?: string
  extra_tlv?: { [k: string]: string }
}
export function keysend(
  opts: KeysendOpts,
  ownerPubkey?: string
): Promise<interfaces.SendPaymentResponse> {
  sphinxLogger.info('keysend', logging.Lightning)
  return new Promise(async function (resolve, reject) {
    try {
      const preimage = ByteBuffer.wrap(crypto.randomBytes(32))
      const dest_custom_records = {
        [`${LND_KEYSEND_KEY}`]: preimage,
      }
      if (opts.extra_tlv) {
        Object.entries(opts.extra_tlv).forEach(([k, v]) => {
          dest_custom_records[k] = ByteBuffer.fromUTF8(v)
        })
      }
      const options: interfaces.KeysendRequest = {
        amt: Math.max(opts.amt, constants.min_sat_amount || 3),
        final_cltv_delta: 10,
        dest: ByteBuffer.fromHex(opts.dest),
        dest_custom_records,
        payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
        dest_features: [9],
      }
      if (opts.data) {
        options.dest_custom_records[`${SPHINX_CUSTOM_RECORD_KEY}`] =
          ByteBuffer.fromUTF8(opts.data)
      }
      // add in route hints
      if (opts.route_hint && opts.route_hint.includes(':')) {
        const arr = opts.route_hint.split(':')
        const node_id = arr[0]
        const chan_id = arr[1]
        options.route_hints = [
          {
            hop_hints: [{ node_id, chan_id }],
          },
        ]
      }
      // sphinx-proxy sendPaymentSync
      if (isProxy()) {
        // console.log("SEND sendPaymentSync", options)
        options.fee_limit = { fixed: FEE_LIMIT_SAT }
        const lightning = await loadLightning(true, ownerPubkey) // try proxy
        lightning.sendPaymentSync(options, (err, response) => {
          if (err) {
            reject(err)
          } else {
            if (response.payment_error) {
              reject(response.payment_error)
            } else {
              resolve(response)
            }
          }
        })
      } else {
        if (IS_GREENLIGHT) {
          const lightning = await loadLightning(false, ownerPubkey)
          const req = interfaces.keysendRequest(options)
          // console.log("KEYSEND REQ", JSON.stringify(req))
          lightning.keysend(req, function (err, response) {
            if (err == null) {
              resolve(interfaces.keysendResponse(response))
            } else {
              reject(err)
            }
          })
        } else {
          // console.log("SEND sendPaymentV2", options)
          // new sendPayment (with optional route hints)
          options.fee_limit_sat = FEE_LIMIT_SAT
          options.timeout_seconds = 16
          const router = await loadRouter()
          const call = router.sendPaymentV2(options)
          call.on('data', function (payment) {
            const state = payment.status || payment.state
            if (payment.payment_error) {
              reject(payment.payment_error)
            } else {
              if (state === 'IN_FLIGHT') {
                // do nothing
              } else if (state === 'FAILED_NO_ROUTE') {
                reject(payment.failure_reason || payment)
              } else if (state === 'FAILED') {
                reject(payment.failure_reason || payment)
              } else if (state === 'SUCCEEDED') {
                resolve(payment)
              }
            }
          })
          call.on('error', function (err) {
            reject(err)
          })
          // call.write(options)
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}

export function loadRouter(): any {
  if (routerClient) {
    return routerClient
  } else {
    const credentials = loadCredentials('router.macaroon')
    const descriptor = grpc.load('proto/router.proto')
    const router: any = descriptor.routerrpc
    routerClient = new router.Router(
      LND_IP + ':' + config.lnd_port,
      credentials
    )
    return routerClient
  }
}

const MAX_MSG_LENGTH = 972 // 1146 - 20 ???
export async function keysendMessage(
  opts: KeysendOpts,
  ownerPubkey?: string
): Promise<interfaces.SendPaymentResponse> {
  sphinxLogger.info('keysendMessage', logging.Lightning)
  return new Promise(async function (resolve, reject) {
    if (!opts.data || typeof opts.data !== 'string') {
      return reject('string plz')
    }

    if (opts.data.length < MAX_MSG_LENGTH) {
      try {
        const res = await keysend(opts, ownerPubkey)
        resolve(res)
      } catch (e) {
        reject(e)
      }
      return
    }
    // too long! need to send serial
    const n = Math.ceil(opts.data.length / MAX_MSG_LENGTH)
    let success = false
    let fail = false
    let res: any = null
    const ts = new Date().valueOf()
    // WEAVE MESSAGE If TOO LARGE
    for (let i = 0; i < n; i++) {
      const spliti = Math.ceil((opts.data || '').length / n)
      const m = (opts.data || '').substring(i * spliti, i * spliti + spliti)
      const isLastThread = i === n - 1
      const amt = isLastThread ? opts.amt : constants.min_sat_amount
      try {
        res = await keysend(
          {
            ...opts,
            amt, // split the amt too
            data: `${ts}_${i}_${n}_${m}`,
          },
          ownerPubkey
        )
        success = true
        await sleep(432)
      } catch (e) {
        sphinxLogger.error(e)
        fail = true
      }
    }
    if (success && !fail) {
      resolve(res)
    } else {
      reject(new Error('fail'))
    }
  })
}

export async function signAscii(
  ascii: string,
  ownerPubkey?: string
): Promise<string> {
  const sig = await signMessage(ascii_to_hexa(ascii), ownerPubkey)
  return sig
}

export function listInvoices(): Promise<any> {
  sphinxLogger.info('listInvoices', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listInvoices(
      {
        num_max_invoices: 100000,
        reversed: true,
      },
      (err, response) => {
        if (!err) {
          resolve(response)
        } else {
          reject(err)
        }
      }
    )
  })
}

export async function listAllInvoices(): Promise<interfaces.Invoice[]> {
  sphinxLogger.info(`=> list all invoices`)
  return paginateInvoices(40)
}

async function paginateInvoices(limit: number, i = 0): Promise<interfaces.Invoice[]> {
  try {
    const r = await listInvoicesPaginated(limit, i)
    const lastOffset = parseInt(r.first_index_offset)
    if (lastOffset > 0) {
      return r.invoices.concat(await paginateInvoices(limit, lastOffset))
    }
    return r.invoices
  } catch (e) {
    return []
  }
}

function listInvoicesPaginated(limit: number, offset: number): Promise<{ first_index_offset: string, invoices: interfaces.Invoice[] }> {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listInvoices(
      {
        num_max_invoices: limit,
        index_offset: offset,
        reversed: true,
      },
      (err, response) => {
        if (!err && response && response.invoices) resolve(response)
        else reject(err)
      }
    )
  })
}

// need to upgrade to .10 for this
export async function listAllPayments(): Promise<interfaces.Payment[]> {
  sphinxLogger.info('=> list all payments')
  const pays = await paginatePayments(40) // max num
  sphinxLogger.info(`pays ${pays && pays.length}`)
  return pays
}

async function paginatePayments(limit: number, i = 0): Promise<interfaces.Payment[]> {
  try {
    const r = await listPaymentsPaginated(limit, i)
    const lastOffset = parseInt(r.first_index_offset) // this is "first" cuz its in reverse (lowest index)
    if (lastOffset > 0) {
      return r.payments.concat(await paginatePayments(limit, lastOffset))
    }
    return r.payments
  } catch (e) {
    return []
  }
}

export function listPaymentsPaginated(limit: number, offset: number): Promise<{ first_index_offset: string, payments: interfaces.Payment[] }> {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listPayments(
      {
        max_payments: limit,
        index_offset: offset,
        reversed: true,
      },
      (err, response) => {
        if (!err && response && response.payments) resolve(response)
        else reject(err)
      }
    )
  })
}

export function listAllPaymentsFull(): Promise<{ payments: interfaces.Payment[] }> {
  sphinxLogger.info('=> list all payments')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listPayments({}, (err, response) => {
      if (!err && response && response.payments) {
        resolve(response.payments)
      } else {
        reject(err)
      }
    })
  })
}

// msg is hex
export async function signMessage(msg: string, ownerPubkey?: string): Promise<string> {
  return signBuffer(Buffer.from(msg, 'hex'), ownerPubkey)
}

export function signBuffer(msg: Buffer, ownerPubkey?: string): Promise<string> {
  sphinxLogger.info('signBuffer', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    try {
      if (IS_GREENLIGHT) {
        const pld = interfaces.greenlightSignMessagePayload(msg)
        const sig = libhsmd.Handle(1024, 0, null, pld)
        const sigBuf = Buffer.from(sig, 'hex')
        const sigBytes = sigBuf.subarray(2, 66)
        const recidBytes = sigBuf.subarray(66, 67)
        // 31 is the magic EC recid (27+4) for compressed pubkeys
        const ecRecid = Buffer.from(recidBytes).readUIntBE(0, 1) + 31
        const finalRecid = Buffer.allocUnsafe(1)
        finalRecid.writeUInt8(ecRecid, 0)
        const finalSig = Buffer.concat([finalRecid, sigBytes], 65)
        resolve(zbase32.encode(finalSig))
      } else {
        const lightning = await loadLightning(true, ownerPubkey) // try proxy
        const options = { msg }
        lightning.signMessage(options, function (err, sig) {
          if (err || !sig.signature) {
            reject(err)
          } else {
            resolve(sig.signature)
          }
        })
      }
    } catch (e) {
      reject(e)
    }
  })
}

export async function verifyBytes(
  msg: Buffer,
  sig: string
): Promise<VerifyResponse> {
  const r = await verifyMessage(msg.toString('hex'), sig)
  return r
}

export interface VerifyResponse {
  valid: boolean
  pubkey: string
}
// msg input is hex encoded, sig is zbase32 encoded
export function verifyMessage(
  msg: string,
  sig: string,
  ownerPubkey?: string
): Promise<VerifyResponse> {
  sphinxLogger.info('verifyMessage', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    try {
      if (IS_GREENLIGHT) {
        const fullBytes = zbase32.decode(sig)
        const sigBytes = fullBytes.slice(1)
        const recidBytes = fullBytes.slice(0, 1)
        // 31 (27+4) is the magic number for compressed recid
        const recid = Buffer.from(recidBytes).readUIntBE(0, 1) - 31
        // "Lightning Signed Message:"
        const prefixBytes = Buffer.from(
          '4c696768746e696e67205369676e6564204d6573736167653a',
          'hex'
        )
        const msgBytes = Buffer.from(msg, 'hex')
        // double hash
        const hash = sha.sha256.arrayBuffer(
          sha.sha256.arrayBuffer(
            Buffer.concat(
              [prefixBytes, msgBytes],
              msgBytes.length + prefixBytes.length
            )
          )
        )
        const recoveredPubkey: Buffer = secp256k1.recover(
          Buffer.from(hash), // 32 byte hash of message
          sigBytes, // 64 byte signature of message (not DER, 32 byte R and 32 byte S with 0x00 padding)
          recid, // number 1 or 0. This will usually be encoded in the base64 message signature
          true // true if you want result to be compressed (33 bytes), false if you want it uncompressed (65 bytes) this also is usually encoded in the base64 signature
        )
        resolve(<VerifyResponse>{
          valid: true,
          pubkey: recoveredPubkey.toString('hex'),
        })
      } else {
        const lightning = await loadLightning(true, ownerPubkey) // try proxy
        const options = {
          msg: ByteBuffer.fromHex(msg),
          signature: sig, // zbase32 encoded string
        }
        lightning.verifyMessage(options, function (err, res) {
          // console.log(res)
          if (err || !res.pubkey) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      }
    } catch (e) {
      reject(e)
    }
  })
}
export async function verifyAscii(
  ascii: string,
  sig: string,
  ownerPubkey?: string
): Promise<VerifyResponse> {
  const r = await verifyMessage(ascii_to_hexa(ascii), sig, ownerPubkey)
  return r
}

export async function getInfo(
  tryProxy?: boolean,
  noCache?: boolean
): Promise<interfaces.GetInfoResponse> {
  // log('getInfo')
  return new Promise(async (resolve, reject) => {
    try {
      const lightning = await loadLightning(
        tryProxy === false ? false : true,
        undefined,
        noCache
      ) // try proxy
      lightning.getInfo({}, function (err, response) {
        if (err == null) {
          resolve(interfaces.getInfoResponse(response))
        } else {
          reject(err)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

export async function addInvoice(
  request: interfaces.AddInvoiceRequest,
  ownerPubkey?: string
): Promise<interfaces.AddInvoiceResponse> {
  // log('addInvoice')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    const cmd = interfaces.addInvoiceCommand()
    const req = interfaces.addInvoiceRequest(request)
    lightning[cmd](req, function (err, response) {
      if (err == null) {
        resolve(interfaces.addInvoiceResponse(response))
      } else {
        reject(err)
      }
    })
  })
}

export async function listPeers(
  args?: interfaces.ListPeersArgs,
  ownerPubkey?: string
): Promise<interfaces.ListPeersResponse> {
  sphinxLogger.info('listChannels', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey)
    const opts = interfaces.listPeersRequest(args)
    lightning.listPeers(opts, function (err, response) {
      if (err == null) {
        resolve(interfaces.listPeersResponse(response))
      } else {
        reject(err)
      }
    })
  })
}

export async function listChannels(
  args?: interfaces.ListChannelsArgs,
  ownerPubkey?: string
): Promise<interfaces.ListChannelsResponse> {
  sphinxLogger.info('listChannels', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    const cmd = interfaces.listChannelsCommand()
    const opts = interfaces.listChannelsRequest(args)
    lightning[cmd](opts, function (err, response) {
      if (err == null) {
        resolve(interfaces.listChannelsResponse(response))
      } else {
        reject(err)
      }
    })
  })
}

export async function pendingChannels(
  ownerPubkey?: string
): Promise<{ [k: string]: any }> {
  sphinxLogger.info('pendingChannels', logging.Lightning)
  if (IS_GREENLIGHT) return []
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    lightning.pendingChannels({}, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

export async function connectPeer(
  args: interfaces.ConnectPeerArgs
): Promise<{ [k: string]: any }> {
  sphinxLogger.info('connectPeer', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    const req = interfaces.connectPeerRequest(args)
    lightning.connectPeer(req, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

export interface OpenChannelArgs {
  node_pubkey: any // bytes
  local_funding_amount: number
  push_sat: number // 0
  sat_per_byte: number // 75?
}
export async function openChannel(
  args: OpenChannelArgs
): Promise<{ [k: string]: any }> {
  sphinxLogger.info('openChannel', logging.Lightning)
  const opts = args || {}
  if (args && args.node_pubkey) {
    opts.node_pubkey = ByteBuffer.fromHex(args.node_pubkey)
  }
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.openChannelSync(opts, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

interface ComplexBalances {
  pending_open_balance: number
  balance: number
  reserve: number
  full_balance: number
}
export async function complexBalances(
  ownerPubkey?: string
): Promise<ComplexBalances> {
  sphinxLogger.info('complexBalances', logging.Lightning)
  const channelList = await listChannels({}, ownerPubkey)
  const { channels } = channelList
  if (IS_GREENLIGHT) {
    const local_balance = channels.reduce(
      (a, chan) => a + parseInt(chan.local_balance),
      0
    )
    return <ComplexBalances>{
      reserve: 0,
      full_balance: Math.max(0, local_balance),
      balance: Math.max(0, local_balance),
      pending_open_balance: 0,
    }
  } else {
    const reserve = channels.reduce(
      (a, chan) => a + parseInt(chan.local_chan_reserve_sat),
      0
    )
    const spendableBalance = channels.reduce(
      (a, chan) => a + Math.max(0, parseInt(chan.local_balance) - parseInt(chan.local_chan_reserve_sat)),
      0
    )
    const response = await channelBalance(ownerPubkey)
    return <ComplexBalances>{
      reserve,
      full_balance: Math.max(0, parseInt(response.balance)),
      balance: spendableBalance,
      pending_open_balance: parseInt(response.pending_open_balance),
    }
  }
}

export async function channelBalance(
  ownerPubkey?: string
): Promise<{ [k: string]: any }> {
  sphinxLogger.info('channelBalance', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    lightning.channelBalance({}, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

export async function getChanInfo(
  chan_id: number,
  tryProxy?: boolean
): Promise<{ [k: string]: any }> {
  // log('getChanInfo')
  if (IS_GREENLIGHT) return {} // skip for now
  return new Promise(async (resolve, reject) => {
    if (!chan_id) {
      return reject('no chan id')
    }
    const lightning = await loadLightning(tryProxy === false ? false : true) // try proxy
    lightning.getChanInfo({ chan_id }, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

function ascii_to_hexa(str) {
  const arr1 = <string[]>[]
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16)
    arr1.push(hex)
  }
  return arr1.join('')
}

// async function loadLightningNew() {
//   if (lightningClient) {
//     return lightningClient
//   } else {
//   	var credentials = loadCredentials()
//     const packageDefinition = await protoLoader.load("rpc.proto", {})
//     const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
//     var { lnrpc } = lnrpcDescriptor;
//     lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }
