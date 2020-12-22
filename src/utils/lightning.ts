import * as ByteBuffer from 'bytebuffer'
import * as fs from 'fs'
import * as grpc from 'grpc'
import { sleep } from '../helpers';
import * as sha from 'js-sha256'
import * as crypto from 'crypto'
import constants from '../constants'
import { getMacaroon } from './macaroon'
import { loadConfig } from './config'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'

const LND_KEYSEND_KEY = 5482373484
const SPHINX_CUSTOM_RECORD_KEY = 133773310

var lightningClient = <any>null;
var walletUnlocker = <any>null;

const loadCredentials = (macName?: string) => {
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

const loadLightning = () => {
  if (lightningClient) {
    return lightningClient
  } else {
    try {
      var credentials = loadCredentials()
      var lnrpcDescriptor = grpc.load("proto/rpc.proto");
      var lnrpc: any = lnrpcDescriptor.lnrpc
      lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
      return lightningClient
    } catch (e) {
      throw e
    }
  }
}

const loadWalletUnlocker = () => {
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

const unlockWallet = async (pwd: string) => {
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

const getHeaders = (req) => {
  return {
    "X-User-Token": req.headers['x-user-token'],
    "X-User-Email": req.headers['x-user-email']
  }
}

var isLocked = false
let lockTimeout: ReturnType<typeof setTimeout>;
const getLock = () => isLocked
const setLock = (value) => {
  isLocked = value
  console.log({ isLocked })
  if (lockTimeout) clearTimeout(lockTimeout)
  lockTimeout = setTimeout(() => {
    isLocked = false
    console.log({ isLocked })
  }, 1000 * 60 * 2)
}

const getRoute = async (pub_key, amt, callback) => {
  let lightning = await loadLightning()
  lightning.queryRoutes(
    { pub_key, amt },
    (err, response) => callback(err, response)
  )
}

const queryRoute = async (pub_key, amt) => {
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning()
    lightning.queryRoutes(
      { pub_key, amt },
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

const keysend = (opts) => {
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning()
    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    const options = {
      amt: Math.max(opts.amt, constants.min_sat_amount || 3),
      final_cltv_delta: 10,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
        [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data),
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features: [9],
      fee_limit: { fixed: 10 }
    }
    const call = lightning.sendPayment()
    call.on('data', function (payment) {
      if (payment.payment_error) {
        reject(payment.payment_error)
      } else {
        resolve(payment)
      }
    })
    call.on('error', function (err) {
      reject(err)
    })
    call.write(options)
  })
}

const MAX_MSG_LENGTH = 972 // 1146 - 20 ???
async function keysendMessage(opts) {
  return new Promise(async function (resolve, reject) {
    if (!opts.data || typeof opts.data !== 'string') {
      return reject('string plz')
    }

    if (opts.data.length < MAX_MSG_LENGTH) {
      try {
        const res = await keysend(opts)
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
        })
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

async function signAscii(ascii) {
  try {
    const sig = await signMessage(ascii_to_hexa(ascii))
    return sig
  } catch (e) {
    throw e
  }
}

function listInvoices() {
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

async function listAllInvoices() {
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
async function listAllPayments() {
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
function listPaymentsPaginated(limit, offset) {
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

function listAllPaymentsFull() {
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

const signMessage = (msg) => {
  return new Promise(async (resolve, reject) => {
    let lightning = await loadLightning()
    try {
      const options = { msg: ByteBuffer.fromHex(msg) }
      lightning.signMessage(options, function (err, sig) {
        if (err || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

const signBuffer = (msg) => {
  return new Promise(async (resolve, reject) => {
    let lightning = await loadLightning()
    try {
      const options = { msg }
      lightning.signMessage(options, function (err, sig) {
        if (err || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

async function verifyBytes(msg, sig): Promise<{ [k: string]: any }> {
  try {
    const r = await verifyMessage(msg.toString('hex'), sig)
    return r
  } catch (e) {
    throw e
  }
}
function verifyMessage(msg, sig): Promise<{ [k: string]: any }> {
  return new Promise(async (resolve, reject) => {
    let lightning = await loadLightning()
    try {
      const options = {
        msg: ByteBuffer.fromHex(msg),
        signature: sig, // zbase32 encoded string
      }
      lightning.verifyMessage(options, function (err, res) {
        if (err || !res.pubkey) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
async function verifyAscii(ascii, sig): Promise<{ [k: string]: any }> {
  try {
    const r = await verifyMessage(ascii_to_hexa(ascii), sig)
    return r
  } catch (e) {
    throw e
  }
}

async function getInfo(): Promise<{ [k: string]: any }> {
  return new Promise((resolve, reject) => {
    const lightning = loadLightning()
    lightning.getInfo({}, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

interface ListChannelsArgs {
  active_only?: boolean
  inactive_only?: boolean
  peer?: string // HEX!
}
async function listChannels(args?:ListChannelsArgs): Promise<{ [k: string]: any }> {
  const opts:{[k:string]:any} = args || {}
  if(args && args.peer) {
    opts.peer = ByteBuffer.fromHex(args.peer)
  }
  return new Promise((resolve, reject) => {
    const lightning = loadLightning()
    lightning.listChannels(opts, function (err, response) {
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
  return new Promise((resolve, reject) => {
    const lightning = loadLightning()
    lightning.openChannelSync(args, function (err, response) {
      if (err == null) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

async function channelBalance(): Promise<{ [k: string]: any }> {
  return new Promise((resolve, reject) => {
    const lightning = loadLightning()
    lightning.channelBalance({}, function (err, response) {
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

export {
  loadCredentials,
  loadLightning,
  loadWalletUnlocker,
  getHeaders,
  getLock,
  setLock,
  getRoute,
  keysend,
  keysendMessage,
  signMessage,
  verifyMessage,
  verifyAscii,
  verifyBytes,
  signAscii,
  signBuffer,
  LND_KEYSEND_KEY,
  SPHINX_CUSTOM_RECORD_KEY,
  listInvoices,
  listAllPayments,
  getInfo,
  listAllInvoices,
  listAllPaymentsFull,
  queryRoute,
  listChannels,
  channelBalance,
  unlockWallet,
}
