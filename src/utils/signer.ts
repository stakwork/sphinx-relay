import { loadProto } from '../grpc/proto'
import { SignerClient } from '../grpc/types/signrpc/Signer'
import * as Lightning from '../grpc/lightning'
import { loadConfig } from './config'
import { sphinxLogger } from './logger'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'

let signerClient: SignerClient | undefined

export function loadSigner(): SignerClient {
  if (signerClient) {
    return signerClient
  } else {
    try {
      const credentials = Lightning.loadCredentials('signer.macaroon')
      const lnrpcDescriptor = loadProto('signer')
      const signer = lnrpcDescriptor.signrpc
      return (signerClient = new signer.Signer(
        LND_IP + ':' + config.lnd_port,
        credentials
      ))
    } catch (e) {
      //only throw here
      sphinxLogger.warning('loadSigner has failed')
      throw e
    }
  }
}

export const signMessage = (msg) => {
  const signer = loadSigner()
  return new Promise((resolve, reject) => {
    try {
      const options = {
        msg: Buffer.from(msg, 'hex'),
        key_loc: { key_family: 6, key_index: 0 },
      }
      signer.signMessage(options, function (err, sig) {
        if (err || !sig || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature.toString('base64'))
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

export const signBuffer = (msg) => {
  const signer = loadSigner()
  return new Promise((resolve, reject) => {
    try {
      const options = { msg }
      signer.signMessage(options, function (err, sig) {
        if (err || !sig || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature.toString('base64'))
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

function verifyMessage(msg, sig, pubkey): Promise<{ [k: string]: any }> {
  const signer = loadSigner()
  return new Promise((resolve, reject) => {
    if (msg.length === 0) {
      return reject('invalid msg')
    }
    if (sig.length !== 96) {
      return reject('invalid sig')
    }
    if (pubkey.length !== 66) {
      return reject('invalid pubkey')
    }
    try {
      const options = {
        msg: Buffer.from(msg, 'hex'),
        signature: Buffer.from(sig, 'base64'),
        pubkey: Buffer.from(pubkey, 'hex'),
      }
      signer.verifyMessage(options, function (err, res) {
        if (err || !res) {
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

export async function signAscii(ascii) {
  try {
    const sig = await signMessage(ascii_to_hexa(ascii))
    return sig
  } catch (e) {
    sphinxLogger.warning('signAscii has failed')
    throw e
  }
}

export async function verifyAscii(
  ascii: string,
  sig: Buffer,
  pubkey: string
): Promise<{ [k: string]: any }> {
  try {
    const r = await verifyMessage(ascii_to_hexa(ascii), sig, pubkey)
    return r
  } catch (e) {
    sphinxLogger.warning('verifyAscii has failed')
    throw e
  }
}

function ascii_to_hexa(str) {
  const arr1 = <string[]>[]
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16)
    arr1.push(hex)
  }
  return arr1.join('')
}
