import * as fs from 'fs'
import * as grpc from '@grpc/grpc-js'
import { loadProto } from './proto'
import { LightningClient } from './types/lnrpc/Lightning'
import { LightningClient as ProxyLightningClient } from './types/lnrpc_proxy/Lightning'
import { NodeClient as GreenlightNodeClient } from './types/greenlight/Node'
import { NodeClient } from './types/cln/cln/Node'
import { RouterClient } from './types/routerrpc/Router'
import { WalletUnlockerClient } from './types/lnrpc/WalletUnlocker'
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
import * as short from 'short-uuid'

const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
const IS_LND = config.lightning_provider === 'LND'
export const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'
const IS_CLN = config.lightning_provider === 'CLN'

export const LND_KEYSEND_KEY = 5482373484
export const SPHINX_CUSTOM_RECORD_KEY = 133773310

const FEE_LIMIT_SAT = 10000

let lightningClient:
  | LightningClient
  | ProxyLightningClient
  | NodeClient
  | GreenlightNodeClient
  | undefined
let walletUnlocker: WalletUnlockerClient | undefined
let routerClient: RouterClient | undefined

// typescript helpers for types
export function isLND(
  client:
    | LightningClient
    | ProxyLightningClient
    | NodeClient
    | GreenlightNodeClient
    | undefined
): client is LightningClient | ProxyLightningClient {
  return IS_LND
}

export function isGL(
  client:
    | LightningClient
    | ProxyLightningClient
    | NodeClient
    | GreenlightNodeClient
    | undefined
): client is GreenlightNodeClient {
  return IS_GREENLIGHT
}

export function isCLN(
  client:
    | LightningClient
    | ProxyLightningClient
    | NodeClient
    | GreenlightNodeClient
    | undefined
): client is NodeClient {
  return IS_CLN
}

export function loadCredentials(macName?: string): grpc.ChannelCredentials {
  try {
    // console.log('=> loadCredentials', macName)
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
    console.log('loadCredentials error', e)
    throw 'cannot read LND macaroon or cert'
  }
}

export const loadMtlsCredentials = () => {
  const glCert = fs.readFileSync(config.cln_ca_cert)
  const glPriv = fs.readFileSync(config.cln_device_key)
  const glChain = fs.readFileSync(config.cln_device_cert)
  return grpc.credentials.createSsl(glCert, glPriv, glChain)
}

export async function loadLightning(): Promise<
  LightningClient | NodeClient | GreenlightNodeClient
>
export async function loadLightning(
  tryProxy: false,
  ownerPubkey?: string
): Promise<LightningClient | NodeClient | GreenlightNodeClient>
export async function loadLightning(
  tryProxy?: boolean,
  ownerPubkey?: string
): Promise<
  LightningClient | ProxyLightningClient | NodeClient | GreenlightNodeClient
>
export async function loadLightning(
  tryProxy?: boolean,
  ownerPubkey?: string
): Promise<
  LightningClient | ProxyLightningClient | NodeClient | GreenlightNodeClient
> {
  // only if specified AND available
  if (tryProxy && isProxy() && ownerPubkey) {
    // do not cache proxy lightning
    const theLightningClient = await loadProxyLightning(ownerPubkey)
    if (!theLightningClient) {
      throw new Error('no lightning client')
    }
    return theLightningClient
  }
  if (lightningClient) {
    return lightningClient
  }

  if (IS_GREENLIGHT) {
    const credentials = loadMtlsCredentials()
    const descriptor = loadProto('greenlight')
    const greenlight = descriptor.greenlight
    const options = {
      'grpc.ssl_target_name_override': 'localhost',
    }
    const uri = get_greenlight_grpc_uri().split('//')
    if (!uri[1]) {
      throw new Error('no lightning client')
    }
    return (lightningClient = new greenlight.Node(uri[1], credentials, options))
  }

  if (IS_CLN) {
    const credentials = loadMtlsCredentials()
    const descriptor = loadProto('cln/node')
    const cln = descriptor.cln
    const options = {
      'grpc.ssl_target_name_override': 'cln',
    }
    return (lightningClient = new cln.Node(
      LND_IP + ':' + config.lnd_port,
      credentials,
      options
    ))
  }

  // LND
  const credentials = loadCredentials()
  const lnrpcDescriptor = loadProto('lightning')
  const lnrpc = lnrpcDescriptor.lnrpc
  return (lightningClient = new lnrpc.Lightning(
    LND_IP + ':' + config.lnd_port,
    credentials
  ))
}

export function loadWalletUnlocker(): WalletUnlockerClient {
  if (walletUnlocker) {
    return walletUnlocker
  } else {
    try {
      const credentials = loadCredentials()
      const lnrpcDescriptor = loadProto('walletunlocker')
      const lnrpc = lnrpcDescriptor.lnrpc
      return (walletUnlocker = new lnrpc.WalletUnlocker(
        LND_IP + ':' + config.lnd_port,
        credentials
      ))
    } catch (e) {
      sphinxLogger.error(e)
      throw e
    }
  }
}

export function unlockWallet(pwd: string): Promise<void> {
  return new Promise(function (resolve, reject) {
    const wu = loadWalletUnlocker()
    wu.unlockWallet({ wallet_password: Buffer.from(pwd, 'utf-8') }, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
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
  const lightning = await loadLightning(true, ownerPubkey) // try proxy
  if (isGL(lightning)) {
    // shim for now
    return {
      success_prob: 1,
      routes: [],
    }
  }
  return new Promise((resolve, reject) => {
    // need to manually add 3 block padding
    // which is done behind the scenes in SendPayment
    // https://github.com/lightningnetwork/lnd/issues/3421
    const final_cltv_delta = constants.final_cltv_delta + 3
    const options: { [k: string]: any } = {
      pub_key,
      amt,
      final_cltv_delta,
    }
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
    // TODO remove any
    ;(<any>lightning).queryRoutes(options, (err, response) => {
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
    // TODO remove any
    ;(<any>lightning).newAddress({ type }, (err, response) => {
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
    if (isProxy(lightning)) {
      const opts = {
        payment_request,
        fee_limit: { fixed: FEE_LIMIT_SAT },
      }
      lightning.sendPaymentSync(opts, (err, response) => {
        if (err || !response) {
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
      if (isGL(lightning)) {
        lightning.pay(
          {
            bolt11: payment_request,
            timeout: 12,
          },
          (err, response) => {
            if (err == null && response) {
              resolve(interfaces.keysendResponse(<any>response))
            } else {
              reject(err)
            }
          }
        )
      } else if (isCLN(lightning)) {
        lightning.pay({ bolt11: payment_request }, (err, response) => {
          if (err == null && response) {
            resolve(interfaces.keysendResponse(<any>response))
          } else {
            reject(err)
          }
        })
      } else {
        const call = lightning.sendPayment()
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
    if (opts.dest.length !== 66) {
      return reject('keysend: invalid pubkey')
    }
    try {
      const preimage = crypto.randomBytes(32)
      const payment_hash = Buffer.from(sha.sha256.arrayBuffer(preimage))
      const dest_custom_records: interfaces.DestCustomRecords = {
        [LND_KEYSEND_KEY]: preimage,
      }
      if (opts.extra_tlv) {
        Object.entries(opts.extra_tlv).forEach(([k, v]) => {
          dest_custom_records[k] = Buffer.from(v, 'utf-8')
        })
      }
      if (opts.data) {
        dest_custom_records[SPHINX_CUSTOM_RECORD_KEY] = Buffer.from(
          opts.data,
          'utf-8'
        )
      }
      // feature bits:
      //  9: tlv-onion
      // 15: payment-addr
      // 30: amp (required)
      const keysend_features: interfaces.FeatureBits = [9]
      const amp_features: interfaces.FeatureBits = [9, 15, 30 as any]
      const options: interfaces.KeysendRequest = {
        amt: Math.max(opts.amt, constants.min_sat_amount || 3),
        final_cltv_delta: constants.final_cltv_delta,
        dest: Buffer.from(opts.dest, 'hex'),
        dest_custom_records,
        payment_hash,
        dest_features: keysend_features,
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
      const lightning = await loadLightning(true, ownerPubkey) // try proxy
      if (isProxy(lightning)) {
        // console.log("SEND sendPaymentSync", options)
        options.fee_limit = { fixed: FEE_LIMIT_SAT }
        lightning.sendPaymentSync(options, (err, response) => {
          if (err || !response) {
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
        const lightning = await loadLightning(false, ownerPubkey)
        if (isGL(lightning)) {
          const req = <interfaces.GreenlightKeysendRequest>(
            interfaces.keysendRequest(options)
          )
          // console.log("KEYSEND REQ", JSON.stringify(req))
          // Type 'GreenlightRoutehint[]' is not assignable to type 'Routehint[]'
          // from generated types:
          // export interface Routehint {
          //  hops?: {
          //    node_id?: Buffer | Uint8Array | string
          //    short_channel_id?: string
          //    fee_base?: number | string | Long
          //    fee_prop?: number
          //    cltv_expiry_delta?: number
          //  }[]
          //}
          lightning.keysend(<any>req, function (err, response) {
            if (err == null && response) {
              // TODO greenlight type
              resolve(interfaces.keysendResponse(<any>response))
            } else {
              reject(err)
            }
          })
        } else {
          delete options.payment_hash
          delete dest_custom_records[LND_KEYSEND_KEY]
          options.dest_features = amp_features
          options.amp = true

          options.fee_limit_sat = FEE_LIMIT_SAT
          options.timeout_seconds = 16
          const router = loadRouter()
          const call = router.sendPaymentV2(options)
          call.on('data', async function (payment) {
            const ampState: string = payment.status || payment.state
            if (payment.payment_error) {
              reject(payment.payment_error)
            } else {
              if (ampState === 'SUCCEEDED') {
                resolve(payment)
              } else if (ampState !== 'IN_FLIGHT') {
                sphinxLogger.debug(
                  `AMP ${ampState}, trying keysend`,
                  logging.Lightning
                )
                await new Promise<void>((resolve, reject) =>
                  router.resetMissionControl({}, (err) =>
                    err ? reject(err) : resolve()
                  )
                )
                // restore options
                options.payment_hash = payment_hash
                options.dest_custom_records[LND_KEYSEND_KEY] = preimage
                options.dest_features = keysend_features
                delete options.amp
                const call = router.sendPaymentV2(options)
                call.on('data', function (payment) {
                  const keysendState: string = payment.status || payment.state
                  if (payment.payment_error) {
                    reject(payment.payment_error)
                  } else {
                    if (keysendState === 'SUCCEEDED') {
                      resolve(payment)
                    } else if (keysendState !== 'IN_FLIGHT') {
                      sphinxLogger.debug(
                        `AMP ${ampState} and keysend ${keysendState}`,
                        logging.Lightning
                      )
                      reject(payment.failure_reason || payment)
                    }
                  }
                })
                call.on('error', function (err) {
                  reject(err)
                })
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

export function loadRouter(): RouterClient {
  if (routerClient) {
    return routerClient
  } else {
    const credentials = loadCredentials('router.macaroon')
    const descriptor = loadProto('router')
    const router = descriptor.routerrpc
    return (routerClient = new router.Router(
      LND_IP + ':' + config.lnd_port,
      credentials
    ))
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
    // TODO remove any
    ;(<any>lightning).listInvoices(
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

async function paginateInvoices(
  limit: number,
  i = 0
): Promise<interfaces.Invoice[]> {
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

function listInvoicesPaginated(
  limit: number,
  offset: number
): Promise<{ first_index_offset: string; invoices: interfaces.Invoice[] }> {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    ;(<LightningClient>lightning).listInvoices(
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

async function paginatePayments(
  limit: number,
  i = 0
): Promise<interfaces.Payment[]> {
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

export function listPaymentsPaginated(
  limit: number,
  offset: number
): Promise<{ first_index_offset: string; payments: interfaces.Payment[] }> {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    ;(<LightningClient>lightning).listPayments(
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

export function listAllPaymentsFull(): Promise<interfaces.Payment[]> {
  sphinxLogger.info('=> list all payments')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    ;(<LightningClient>lightning).listPayments({}, (err, response) => {
      if (!err && response && response.payments) {
        resolve(response.payments)
      } else {
        reject(err)
      }
    })
  })
}

// msg is hex
export async function signMessage(
  msg: string,
  ownerPubkey?: string
): Promise<string> {
  return signBuffer(Buffer.from(msg, 'hex'), ownerPubkey)
}

export function signBuffer(msg: Buffer, ownerPubkey?: string): Promise<string> {
  sphinxLogger.info('signBuffer', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    try {
      const lightning = await loadLightning(true, ownerPubkey) // try proxy
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
      } else if (isLND(lightning) || isProxy(lightning)) {
        const options = { msg }
        lightning.signMessage(options, function (err, sig) {
          if (err || !sig || !sig.signature) {
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
      const lightning = await loadLightning(true, ownerPubkey) // try proxy
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
      } else if (isLND(lightning) || isProxy(lightning)) {
        // sig is zbase32 encoded
        lightning.verifyMessage(
          {
            msg: Buffer.from(msg, 'hex'),
            signature: sig,
          },
          function (err, res) {
            // console.log(res)
            if (err || !res || !res.pubkey) {
              reject(err)
            } else {
              resolve(res)
            }
          }
        )
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
  tryProxy?: boolean
): Promise<interfaces.GetInfoResponse> {
  // log('getInfo')
  return new Promise(async (resolve, reject) => {
    try {
      // try proxy
      const lightning = await loadLightning(
        tryProxy === false ? false : true,
        undefined
      )
      // function finish(err, response: interfaces.GetInfoResponseType) {
      //   if (err == null) {
      //     resolve(interfaces.getInfoResponse(response))
      //   } else {
      //     reject(err)
      //   }
      // }
      if (isCLN(lightning)) {
        lightning.getinfo({}, function (err, response) {
          if (err == null) {
            resolve(interfaces.getInfoResponse(response))
          } else {
            reject(err)
          }
        })
      } else if (isGL(lightning)) {
        lightning.getInfo({}, function (err, response) {
          if (err == null) {
            // FIXME?
            resolve(
              interfaces.getInfoResponse(
                response as unknown as interfaces.GreenlightGetInfoResponse
              )
            )
          } else {
            reject(err)
          }
        })
      } else {
        lightning.getInfo({}, function (err, response) {
          if (err == null) {
            // FIXME?
            resolve(
              interfaces.getInfoResponse(
                response as unknown as interfaces.GetInfoResponse
              )
            )
          } else {
            reject(err)
          }
        })
      }
    } catch (e) {
      reject(e)
    }
  })
}

export async function addInvoice(
  request: interfaces.AddInvoiceRequest,
  ownerPubkey?: string
): Promise<interfaces.AddInvoiceResponse | { payment_request: string }> {
  // log('addInvoice')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    if (isLND(lightning) || isProxy(lightning)) {
      const cmd = interfaces.addInvoiceCommand()
      const req = interfaces.addInvoiceRequest(request)
      lightning[cmd](req, function (err, response) {
        if (err == null) {
          resolve(interfaces.addInvoiceResponse(response))
        } else {
          reject(err)
        }
      })
    } else if (isCLN(lightning)) {
      const label = short.generate()
      lightning.invoice(
        {
          amount_msat: {
            amount: { msat: convertToMsat(request.value as number) },
          },
          label,
          description: request.memo,
        },
        function (err, response) {
          if (err == null) {
            resolve({ payment_request: response?.bolt11 || '' })
          } else {
            sphinxLogger.error([err], logging.Lightning)
            reject(err)
          }
        }
      )
    }
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
    ;(<LightningClient>lightning).listPeers(opts, function (err, response) {
      if (err == null && response) {
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
    const opts = interfaces.listChannelsRequest(args)
    if (isGL(lightning)) {
      lightning.listPeers(opts, function (err, response) {
        if (err == null && response) {
          resolve(interfaces.listChannelsResponse(response))
        } else {
          reject(err)
        }
      })
    } else {
      // TODO remove any
      ;(<any>lightning).listChannels(opts, function (err, response) {
        if (err == null && response) {
          resolve(interfaces.listChannelsResponse(response))
        } else {
          reject(err)
        }
      })
    }
  })
}

// if separate fields get used in relay, it might be worth to add the types, just copy em from src/grpc/types with go to declaration of your ide
export async function pendingChannels(ownerPubkey?: string): Promise<{
  total_limbo_balance: string
  pending_open_channels: unknown[]
  pending_closing_channels: unknown[]
  pending_force_closing_channels: unknown[]
  waiting_close_channels: unknown[]
}> {
  sphinxLogger.info('pendingChannels', logging.Lightning)
  const lightning = await loadLightning(true, ownerPubkey) // try proxy
  const emptyChans = {
    total_limbo_balance: '0',
    pending_open_channels: [],
    pending_closing_channels: [],
    pending_force_closing_channels: [],
    waiting_close_channels: [],
  }
  if (isGL(lightning)) {
    return emptyChans
  }
  if (isProxy()) {
    return emptyChans
  }
  return new Promise((resolve, reject) => {
    // no pendingChannels on proxy??????
    ;(<LightningClient>lightning).pendingChannels({}, function (err, response) {
      if (err == null && response) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

/** return void for LND, { node_id: string, features: string } for greenlight*/
export async function connectPeer(
  args: interfaces.ConnectPeerArgs
): Promise<void | {
  node_id: string
  features: string
}> {
  sphinxLogger.info('connectPeer', logging.Lightning)
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    if (isGL(lightning)) {
      const req = interfaces.connectPeerRequest(args)
      lightning.connectPeer(
        <interfaces.GreenlightConnectPeerArgs>req,
        function (err, response) {
          if (err == null && response) {
            resolve(response)
          } else {
            reject(err)
          }
        }
      )
    } else if (isLND(lightning)) {
      lightning.connectPeer(args, function (err, response) {
        if (err == null && response) {
          resolve()
        } else {
          reject(err)
        }
      })
    }
  })
}

export interface OpenChannelArgs {
  node_pubkey: string | Buffer // bytes
  local_funding_amount: number
  push_sat: number // 0
  sat_per_byte: number // 75?
}
export type OpenChannelResponse =
  | {
      funding_txid_bytes: never
      funding_txid_str: string
      output_index: number
      funding_txid: 'funding_txid_str'
    }
  | {
      funding_txid_bytes: Buffer
      funding_txid_str: never
      output_index: number
      funding_txid: 'funding_txid_bytes'
    }
/** does nothing and returns nothing for greenlight */
export async function openChannel(
  args: OpenChannelArgs
): Promise<OpenChannelResponse | void> {
  sphinxLogger.info('openChannel', logging.Lightning)
  const opts = args || {}
  const lightning = await loadLightning()
  if (isGL(lightning)) {
    return
  }
  if (isCLN(lightning)) {
    return // FIXME
  }
  return new Promise((resolve, reject) => {
    lightning.openChannelSync(opts, function (err, response) {
      if (err == null && response) {
        resolve(<OpenChannelResponse>response)
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
      (a, chan) =>
        a +
        Math.max(
          0,
          parseInt(chan.local_balance) - parseInt(chan.local_chan_reserve_sat)
        ),
      0
    )
    const response = await channelBalance(ownerPubkey)
    return <ComplexBalances>{
      reserve,
      full_balance: response ? Math.max(0, parseInt(response.balance)) : 0,
      balance: spendableBalance,
      pending_open_balance: response
        ? parseInt(response.pending_open_balance)
        : 0,
    }
  }
}

interface _lnrpc_Amount__Output {
  sat: string
  msat: string
}

export async function channelBalance(ownerPubkey?: string): Promise<{
  balance: string
  pending_open_balance: string
  local_balance: _lnrpc_Amount__Output | null
  remote_balance: _lnrpc_Amount__Output | null
  unsettled_local_balance: _lnrpc_Amount__Output | null
  unsettled_remote_balance: _lnrpc_Amount__Output | null
  pending_open_local_balance: _lnrpc_Amount__Output | null
  pending_open_remote_balance: _lnrpc_Amount__Output | null
} | void> {
  sphinxLogger.info('channelBalance', logging.Lightning)
  const lightning = await loadLightning(true, ownerPubkey) // try proxy
  if (isGL(lightning)) {
    return
  }
  if (isCLN(lightning)) {
    return // FIXME
  }
  return new Promise((resolve, reject) => {
    lightning.channelBalance({}, function (err, response) {
      if (err == null && response) {
        resolve(response)
      } else {
        reject(err)
      }
    })
  })
}

interface _lnrpc_RoutingPolicy__Output {
  time_lock_delta: number
  min_htlc: string
  fee_base_msat: string
  fee_rate_milli_msat: string
  disabled: boolean
  max_htlc_msat: string
  last_update: number
}

/** returns void for greenlight */
export async function getChanInfo(
  chan_id: number,
  tryProxy?: boolean
): Promise<{
  channel_id: string
  chan_point: string
  last_update: number
  node1_pub: string
  node2_pub: string
  capacity: string
  node1_policy: _lnrpc_RoutingPolicy__Output | null
  node2_policy: _lnrpc_RoutingPolicy__Output | null
} | void> {
  // log('getChanInfo')
  const lightning = await loadLightning(tryProxy === false ? false : true) // try proxy
  if (isGL(lightning)) {
    return // skip for now
  }
  if (isCLN(lightning)) {
    return // FIXME
  }
  return new Promise((resolve, reject) => {
    if (!chan_id) {
      return reject('no chan id')
    }
    lightning.getChanInfo({ chan_id }, function (err, response) {
      if (err == null && response) {
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

export async function getInvoiceHandler(
  payment_hash: string,
  ownerPubkey?: string
) {
  sphinxLogger.info('getInvoice', logging.Lightning)
  const payment_hash_bytes = Buffer.from(payment_hash, 'hex')
  return new Promise(async (resolve, reject) => {
    try {
      const lightning = await loadLightning(true, ownerPubkey)
      if (isGL(lightning)) {
        return //Fixing this later
      } else if (isLND(lightning) || isProxy(lightning)) {
        ;(<any>lightning).lookupInvoice(
          { r_hash: payment_hash_bytes },
          function (err, response) {
            if (err) {
              sphinxLogger.error([err], logging.Lightning)
              reject(err)
            }
            if (response) {
              const invoice = {
                settled: response?.settled,
                payment_request: response?.payment_request,
                payment_hash: response?.r_hash.toString('hex'),
                preimage: response?.settled
                  ? response?.r_preimage.toString('hex')
                  : '',
                amount: convertMsatToSat(response.amt_paid),
              }
              resolve(invoice)
            }
          }
        )
      } else if (isCLN(lightning)) {
        await lightning.listInvoices(
          {
            payment_hash: payment_hash_bytes,
          },
          (err: any, response: any) => {
            if (err) {
              sphinxLogger.error([err], logging.Lightning)
              reject(err)
            }
            if (response) {
              if (response.invoices.length > 0) {
                const res = response.invoices[0]
                const invoice = {
                  amount: convertMsatToSat(
                    res?.amount_received_msat?.msat || 0
                  ),
                  settled: res.status.toLowerCase() === 'paid' ? true : false,
                  payment_request: res.bolt11,
                  preimage:
                    res.status.toLowerCase() === 'paid'
                      ? res.payment_preimage.toString('hex')
                      : '',
                  payment_hash: res.payment_hash.toString('hex'),
                }
                resolve(invoice)
              }
              resolve({})
            }
          }
        )
      }
    } catch (error) {
      sphinxLogger.error([error], logging.Lightning)
      throw error
    }
  })
}

function convertMsatToSat(amount: string) {
  return Number(amount) / 1000
}

function convertToMsat(amount: number) {
  return Number(amount) * 1000
}
// async function loadLightningNew() {
//   if (lightningClient) {
//     return lightningClient
//   } else {
//   	var credentials = loadCredentials()
//     const packageDefinition = await protoLoader.load("lightning.proto", {})
//     const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
//     var { lnrpc } = lnrpcDescriptor;
//     lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }
