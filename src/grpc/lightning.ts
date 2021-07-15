import * as ByteBuffer from 'bytebuffer'
import * as fs from 'fs'
import * as grpc from 'grpc'
import { sleep } from '../helpers';
import * as sha from 'js-sha256'
import * as crypto from 'crypto'
import constants from '../constants'
import { getMacaroon } from '../utils/macaroon'
import { loadConfig } from '../utils/config'
import {isProxy, loadProxyLightning} from '../utils/proxy'
import {logging} from '../utils/logger'
import * as interfaces from './interfaces'
import * as zbase32 from "../utils/zbase32";
import * as secp256k1 from 'secp256k1'
import * as libhsmd from 'libhsmd'
import { get_greenlight_grpc_uri } from './greenlight';

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
// const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";

export const LND_KEYSEND_KEY = 5482373484
export const SPHINX_CUSTOM_RECORD_KEY = 133773310

var lightningClient = <any>null;
var walletUnlocker = <any>null;
var routerClient = <any>null;

export const loadCredentials = (macName?: string) => {
  var lndCert = fs.readFileSync(config.tls_location);
  var sslCreds = grpc.credentials.createSsl(lndCert);
  var macaroon = getMacaroon(macName)
  var metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon)
  var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    callback(null, metadata);
  });

  return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
}

const loadGreenlightCredentials = () => {
  var glCert = fs.readFileSync(config.tls_location);
  var glPriv = fs.readFileSync(config.tls_key_location);
  var glChain = fs.readFileSync(config.tls_chain_location);
  return grpc.credentials.createSsl(glCert, glPriv, glChain);
}

export async function loadLightning(tryProxy?:boolean, ownerPubkey?:string) {
  // only if specified AND available
  if (tryProxy && isProxy()) {
    const pl = await loadProxyLightning(ownerPubkey)
    return pl
  }
  if (lightningClient) {
    return lightningClient
  }

  if (IS_GREENLIGHT) {
    var credentials = loadGreenlightCredentials()
    var descriptor = grpc.load("proto/greenlight.proto");
    var greenlight: any = descriptor.greenlight
    var options = {
      'grpc.ssl_target_name_override' : 'localhost',
    };
    const uri = get_greenlight_grpc_uri().split('//')
    if(!uri[1]) return
    lightningClient = new greenlight.Node(uri[1], credentials, options);
    return lightningClient
  }

  try { // LND
    var credentials = loadCredentials()
    var lnrpcDescriptor = grpc.load("proto/rpc.proto");
    var lnrpc: any = lnrpcDescriptor.lnrpc
    lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
    return lightningClient
  } catch (e) {
    throw e
  } 
}

export const loadWalletUnlocker = () => {
  if (walletUnlocker) {
    return walletUnlocker
  } else {
    var credentials = loadCredentials()
    try {
      var lnrpcDescriptor = grpc.load("proto/walletunlocker.proto");
      var lnrpc: any = lnrpcDescriptor.lnrpc
      walletUnlocker = new lnrpc.WalletUnlocker(LND_IP + ':' + config.lnd_port, credentials);
      return walletUnlocker
    } catch (e) {
      console.log(e)
    }
  }
}

export const unlockWallet = async (pwd: string) => {
  return new Promise(async function (resolve, reject) {
    let wu = await loadWalletUnlocker()
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

export const getHeaders = (req) => {
  return {
    "X-User-Token": req.headers['x-user-token'],
    "X-User-Email": req.headers['x-user-email']
  }
}

var isLocked = false
let lockTimeout: ReturnType<typeof setTimeout>;
export const getLock = () => isLocked
export const setLock = (value) => {
  isLocked = value
  console.log({ isLocked })
  if (lockTimeout) clearTimeout(lockTimeout)
  lockTimeout = setTimeout(() => {
    isLocked = false
    console.log({ isLocked })
  }, 1000 * 60 * 2)
}

export const getRoute = async (pub_key, amt, route_hint, callback) => {
  log('getRoute')
  let lightning = await loadLightning(true) // try proxy
  const options:{[k:string]:any} = { pub_key, amt }
  if(route_hint && route_hint.includes(':')) {
    const arr = route_hint.split(':')
    const node_id = arr[0]
    const chan_id = arr[1]
    options.route_hints = [{
      hop_hints: [{ node_id, chan_id }]
    }]
  }
  lightning.queryRoutes(
    options,
    (err, response) => callback(err, response)
  )
}

export const queryRoute = async (pub_key, amt, route_hint, ownerPubkey?:string) => {
  log('queryRoute')
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning(true, ownerPubkey) // try proxy
    const options:{[k:string]:any} = { pub_key, amt }
    if(route_hint && route_hint.includes(':')) {
      const arr = route_hint.split(':')
      const node_id = arr[0]
      const chan_id = arr[1]
      options.route_hints = [{
        hop_hints: [{ node_id, chan_id }]
      }]
    }
    lightning.queryRoutes(
      options,
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

export const WITNESS_PUBKEY_HASH = 0;
export const NESTED_PUBKEY_HASH = 1;
export const UNUSED_WITNESS_PUBKEY_HASH = 2;
export const UNUSED_NESTED_PUBKEY_HASH = 3;
export type NewAddressType = 0 | 1 | 2 | 3
export async function newAddress(type: NewAddressType = NESTED_PUBKEY_HASH): Promise<string> {
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning()
    lightning.newAddress(
      { type },
      (err, response) => {
        if (err) {
          reject(err)
          return
        }
        if (!(response && response.address)) {
          reject('no address')
          return
        }
        resolve(response.address)
      }
    )
  })
}

// for payingn invoice and invite invoice
export async function sendPayment(payment_request:string, ownerPubkey?:string) {
  log('sendPayment')
  return new Promise(async (resolve,reject)=>{
    let lightning = await loadLightning(true, ownerPubkey) // try proxy
    if(isProxy()) {
      const opts = {
        payment_request,
        fee_limit: {fixed:10}
      }
      lightning.sendPaymentSync(opts, (err, response) => {
        if(err) {
          reject(err)
        }
        else {
          if(response.payment_error) {
            reject(response.payment_error)
          } else {
            resolve(response)
          }
        }
      })
    } else {
      if (IS_GREENLIGHT) {
        lightning.pay({
          bolt11:payment_request, timeout:12
        }, (err, response) => {
          if (err == null) {
            resolve(
              interfaces.keysendResponse(response)
            )
          } else {
            reject(err)
          }
        })
      } else {
        var call = lightning.sendPayment({payment_request})
        call.on('data', async response => {
          if(response.payment_error) {
            reject(response.payment_error)
          } else {
            resolve(response)
          }
        })
        call.on('error', async err => {
          reject(err)
        })
        call.write({ payment_request })
      }
    }
  })
}

interface KeysendOpts {
  amt: number,
  dest: string,
  data?: string,
  route_hint?: string
}
export const keysend = (opts:KeysendOpts, ownerPubkey?:string) => {
  log('keysend')
  return new Promise(async function (resolve, reject) {
    try {
      const FEE_LIMIT_SAT = 10
      const randoStr = crypto.randomBytes(32).toString('hex');
      const preimage = ByteBuffer.fromHex(randoStr)
      const options:interfaces.KeysendRequest = {
        amt: Math.max(opts.amt, constants.min_sat_amount || 3),
        final_cltv_delta: 10,
        dest: ByteBuffer.fromHex(opts.dest),
        dest_custom_records: {
          [`${LND_KEYSEND_KEY}`]: preimage,
        },
        payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
        dest_features: [9],
      }
      if(opts.data) {
        options.dest_custom_records[`${SPHINX_CUSTOM_RECORD_KEY}`] = ByteBuffer.fromUTF8(opts.data)
      }
      // add in route hints
      if(opts.route_hint && opts.route_hint.includes(':')) {
        const arr = opts.route_hint.split(':')
        const node_id = arr[0]
        const chan_id = arr[1]
        options.route_hints = [{
          hop_hints: [{ node_id, chan_id }]
        }]
      }
      // sphinx-proxy sendPaymentSync
      if(isProxy()) {
        // console.log("SEND sendPaymentSync", options)
        options.fee_limit = { fixed: FEE_LIMIT_SAT }
        let lightning = await loadLightning(true, ownerPubkey) // try proxy
        lightning.sendPaymentSync(options, (err, response) => {
          if(err) {
            reject(err)
          }
          else {
            if(response.payment_error) {
              reject(response.payment_error)
            } else {
              resolve(response)
            }
          }
        })
      } else {
        if(IS_GREENLIGHT) {
          let lightning = await loadLightning(false, ownerPubkey)
          const req = interfaces.keysendRequest(options)
          console.log("KEYSEND REQ", JSON.stringify(req))
          lightning.keysend(req, function (err, response) {
            if (err == null) {
              resolve(
                interfaces.keysendResponse(response)
              )
            } else {
              reject(err)
            }
          });
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
    } catch(e) {
      reject(e)
    }
  })
}

export const loadRouter = () => {
  if (routerClient) {
    return routerClient
  } else {
    try {
      var credentials = loadCredentials('router.macaroon')
      var descriptor = grpc.load("proto/router.proto");
      var router: any = descriptor.routerrpc
      routerClient = new router.Router(LND_IP + ':' + config.lnd_port, credentials);
      return routerClient
    } catch (e) {
      throw e
    }
  }
}

const MAX_MSG_LENGTH = 972 // 1146 - 20 ???
export async function keysendMessage(opts, ownerPubkey?:string) {
  log('keysendMessage')
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
    await asyncForEach(Array.from(Array(n)), async (u, i) => {
      const spliti = Math.ceil(opts.data.length / n)
      const m = opts.data.substr(i * spliti, spliti)
      const isLastThread = i === n - 1
      const amt = isLastThread ? opts.amt : constants.min_sat_amount
      try {
        res = await keysend({
          ...opts, amt, // split the amt too
          data: `${ts}_${i}_${n}_${m}`
        }, ownerPubkey)
        success = true
        await sleep(432)
      } catch (e) {
        console.log(e)
        fail = true
      }
    })
    if (success && !fail) {
      resolve(res)
    } else {
      reject(new Error('fail'))
    }
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export async function signAscii(ascii:string, ownerPubkey?:string) {
  try {
    const sig = await signMessage(ascii_to_hexa(ascii), ownerPubkey)
    return sig
  } catch (e) {
    throw e
  }
}

export function listInvoices() {
  log('listInvoices')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listInvoices({
      num_max_invoices: 100000,
      reversed: true,
    }, (err, response) => {
      if (!err) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

export async function listAllInvoices() {
  console.log('=> list all invoices')
  const invs = await paginateInvoices(40)
  return invs
}
async function paginateInvoices(limit, i = 0) {
  try {
    const r: any = await listInvoicesPaginated(limit, i)
    const lastOffset = parseInt(r.first_index_offset)
    if (lastOffset > 0) {
      return r.invoices.concat(await paginateInvoices(limit, lastOffset))
    }
    return r.invoices
  } catch (e) {
    return []
  }
}
function listInvoicesPaginated(limit, offset) {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listInvoices({
      num_max_invoices: limit,
      index_offset: offset,
      reversed: true,
    }, (err, response) => {
      if (!err && response && response.invoices) resolve(response)
      else reject(err)
    })
  })
}

// need to upgrade to .10 for this
export async function listAllPayments() {
  console.log("=> list all payments")
  const pays = await paginatePayments(40) // max num
  console.log('pays', pays && pays.length)
  return pays
}
async function paginatePayments(limit, i = 0) {
  try {
    const r: any = await listPaymentsPaginated(limit, i)
    const lastOffset = parseInt(r.first_index_offset) // this is "first" cuz its in reverse (lowest index)
    if (lastOffset > 0) {
      return r.payments.concat(await paginatePayments(limit, lastOffset))
    }
    return r.payments
  } catch (e) {
    return []
  }
}
export function listPaymentsPaginated(limit, offset) {
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listPayments({
      max_payments: limit,
      index_offset: offset,
      reversed: true,
    }, (err, response) => {
      if (!err && response && response.payments) resolve(response)
      else reject(err)
    })
  })
}

export function listAllPaymentsFull() {
  console.log('=> list all payments')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.listPayments({}, (err, response) => {
      if (!err && response && response.payments) {
        resolve(response.payments)
      } else {
        reject(err)
      }
    });
  })
}

// msg is hex
export async function signMessage(msg:string, ownerPubkey?:string) {
  // log('signMessage')
  try {
    const r = await signBuffer(
      Buffer.from(msg, 'hex'), 
      ownerPubkey
    )
    return r
  } catch (e) {
    throw e
  }
}

export function signBuffer(msg:Buffer, ownerPubkey?:string): Promise<string> {
  log('signBuffer')
  return new Promise(async (resolve, reject) => {
    try {
      if (IS_GREENLIGHT) {
        const pld = interfaces.greenlightSignMessagePayload(msg)
        const sig = libhsmd.Handle(1024, 0, null, pld)
        const sigBuf = Buffer.from(sig, 'hex')
        const sigBytes = sigBuf.subarray(2, 66)
        const recidBytes = sigBuf.subarray(66, 67)
        // 31 is the magic EC recid (27+4) for compressed pubkeys
        const ecRecid = Buffer.from(recidBytes).readUIntBE(0,1) + 31
        const finalRecid = Buffer.from('00', 'hex')
        finalRecid.writeUInt8(ecRecid, 0);
        const finalSig = Buffer.concat([finalRecid, sigBytes], 65)
        resolve(zbase32.encode(finalSig))
      } else {
        let lightning = await loadLightning(true, ownerPubkey) // try proxy
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

export async function verifyBytes(msg:Buffer, sig): Promise<VerifyResponse> {
  try {
    const r = await verifyMessage(msg.toString('hex'), sig)
    return r
  } catch (e) {
    throw e
  }
}

interface VerifyResponse {
  valid: boolean,
  pubkey: string
}
// msg input is hex encoded, sig is zbase32 encoded
export function verifyMessage(msg:string, sig:string, ownerPubkey?:string): Promise<VerifyResponse> {
  log('verifyMessage')
  return new Promise(async (resolve, reject) => {
    try {
      if(IS_GREENLIGHT) {
        const fullBytes = zbase32.decode(sig)
        const sigBytes = fullBytes.slice(1)
        const recidBytes = fullBytes.slice(0,1)
        // 31 (27+4) is the magic number for compressed recid
        const recid = Buffer.from(recidBytes).readUIntBE(0,1) - 31
        // "Lightning Signed Message:"
        const prefixBytes = Buffer.from('4c696768746e696e67205369676e6564204d6573736167653a', 'hex')
        const msgBytes = Buffer.from(msg, 'hex')
        // double hash
        const hash = sha.sha256.arrayBuffer(sha.sha256.arrayBuffer(
          Buffer.concat([
            prefixBytes, msgBytes
          ], msgBytes.length + prefixBytes.length)
        ))
        const recoveredPubkey = secp256k1.recover(
          Buffer.from(hash), // 32 byte hash of message
          sigBytes, // 64 byte signature of message (not DER, 32 byte R and 32 byte S with 0x00 padding)
          recid, // number 1 or 0. This will usually be encoded in the base64 message signature
          true, // true if you want result to be compressed (33 bytes), false if you want it uncompressed (65 bytes) this also is usually encoded in the base64 signature
        );
        resolve(<VerifyResponse>{
          valid: true,
          pubkey: recoveredPubkey.toString('hex'),
        })
      } else {
        let lightning = await loadLightning(true, ownerPubkey) // try proxy
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
export async function verifyAscii(ascii:string, sig:string, ownerPubkey?:string): Promise<VerifyResponse> {
  try {
    const r = await verifyMessage(ascii_to_hexa(ascii), sig, ownerPubkey)
    return r
  } catch (e) {
    throw e
  }
}

export async function getInfo(tryProxy?:boolean): Promise<interfaces.GetInfoResponse> {
  // log('getInfo')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(tryProxy===false?false:true) // try proxy
    lightning.getInfo({}, function (err, response) {
      if (err == null) {
        resolve(
          interfaces.getInfoResponse(response)
        )
      } else {
        reject(err)
      }
    });
  })
}

export async function addInvoice(request: interfaces.AddInvoiceRequest, ownerPubkey?:string): Promise<interfaces.AddInvoiceResponse> {
  // log('addInvoice')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    const cmd = interfaces.addInvoiceCommand()
    const req = interfaces.addInvoiceRequest(request)
    lightning[cmd](req, function (err, response) {
      if (err == null) {
        resolve(
          interfaces.addInvoiceResponse(response)
        )
      } else {
        reject(err)
      }
    });
  })
}

export async function listChannels(args?:interfaces.ListChannelsArgs, ownerPubkey?:string): Promise<interfaces.ListChannelsResponse> {
  log('listChannels')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    const cmd = interfaces.listChannelsCommand()
    const opts = interfaces.listChannelsRequest(args)
    lightning[cmd](opts, function (err, response) {
      if (err == null) {
        resolve(
          interfaces.listChannelsResponse(response)
        )
      } else {
        reject(err)
      }
    })
  })
}

export async function pendingChannels(ownerPubkey?:string): Promise<{ [k: string]: any }> {
  log('pendingChannels')
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

interface Addr {
  pubkey: string
  host: string
}
interface ConnectPeerArgs {
  addr: Addr
}
export async function connectPeer(args: ConnectPeerArgs): Promise<{ [k: string]: any }> {
  log('connectPeer')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning()
    lightning.connectPeer(args, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

export interface OpenChannelArgs {
  node_pubkey: any // bytes
  local_funding_amount: number
  push_sat: number // 0
  sat_per_byte: number // 75?
}
export async function openChannel(args: OpenChannelArgs): Promise<{ [k: string]: any }> {
  log('openChannel')
  const opts = args||{}
  if(args && args.node_pubkey) {
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
    });
  })
}

interface ComplexBalances {
  pending_open_balance: number;
  balance: number;
  reserve: number;
  full_balance: number;
}
export async function complexBalances(ownerPubkey?:string): Promise<ComplexBalances> {
  log('complexBalances')
  const channelList = await listChannels({}, ownerPubkey);
  const { channels } = channelList;
  if (IS_GREENLIGHT) {
    const local_balance = channels.reduce(
      (a, chan) => a + parseInt(chan.local_balance),
      0
    );
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
    );
    const response = await channelBalance(ownerPubkey);
    return <ComplexBalances>{
      reserve,
      full_balance: Math.max(0, parseInt(response.balance)),
      balance: Math.max(0, parseInt(response.balance) - reserve),
      pending_open_balance: parseInt(response.pending_open_balance),
    }
  }
}

export async function channelBalance(ownerPubkey?:string): Promise<{ [k: string]: any }> {
  log('channelBalance')
  return new Promise(async (resolve, reject) => {
    const lightning = await loadLightning(true, ownerPubkey) // try proxy
    lightning.channelBalance({}, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

export async function getChanInfo(chan_id: number, tryProxy?:boolean): Promise<{ [k: string]: any }> {
  // log('getChanInfo')
  if (IS_GREENLIGHT) return {} // skip for now
  return new Promise(async (resolve, reject) => {
    if(!chan_id) {
      return reject('no chan id')
    }
    const lightning = await loadLightning(tryProxy===false?false:true) // try proxy
    lightning.getChanInfo({chan_id}, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

function ascii_to_hexa(str) {
  var arr1 = <string[]>[];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join('');
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
let yeslog = logging.Lightning
function log(a?,b?,c?){
  if(!yeslog) return
  console.log("[lightning]", [...arguments])
}

