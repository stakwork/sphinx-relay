import * as grpc from 'grpc'
import * as Lightning from '../grpc/lightning'
import * as ByteBuffer from 'bytebuffer'
import { loadConfig } from './config'
import { sphinxLogger } from './logger'

import type { ProtoGrpcType } from '../grpc/types/signer'
import type { SignerClient } from '../grpc/types/signrpc/Signer'

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
      const lnrpcDescriptor: ProtoGrpcType = grpc.load('proto/signer.proto')
      const signer = lnrpcDescriptor.signrpc
      signerClient = new signer.Signer(
        LND_IP + ':' + config.lnd_port,
        credentials
      )
      return signerClient
    } catch (e) {
      //only throw here
      sphinxLogger.warning('loadSigner has failed')
      throw e
    }
  }
}

export async function signMessage(msg: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const signer = loadSigner()
    const options = {
      msg: Buffer.from(msg, 'hex'),
      key_loc: { key_family: 6, key_index: 0 }
    }
    signer.signMessage(options, function (err, sig) {
      if (err || !sig || !sig.signature) {
        reject(err)
      } else {
        resolve(sig.signature.toString('base64'))
      }
    })
  })
}

export async function signBuffer(msg: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const signer = loadSigner()
    const options = {
      msg
    }
    signer.signMessage(options, function (err, sig) {
      if (err || !sig || !sig.signature) {
        reject(err)
      } else {
        const buf = ByteBuffer.wrap(sig.signature)
        resolve(buf.toBase64())
      }
    })
  })
}

async function verifyMessage(msg: string, sig: string, pubkey: string): Promise<{ valid: boolean }> {
  return new Promise((resolve, reject) => {
    const signer = loadSigner()
    if (msg.length === 0) {
      return reject('invalid msg')
    }
    if (sig.length !== 96) {
      return reject('invalid sig')
    }
    if (pubkey.length !== 66) {
      return reject('invalid pubkey')
    }
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
  })
}

export async function signAscii(ascii: string): Promise<string> {
  try {
    return signMessage(ascii_to_hexa(ascii))
  } catch (e) {
    sphinxLogger.warning('signAscii has failed')
    throw e
  }
}

export async function verifyAscii(
  ascii: string,
  sig: string,
  pubkey: string
): Promise<{ valid: boolean }> {
  try {
    return verifyMessage(ascii_to_hexa(ascii), sig, pubkey)
  } catch (e) {
    sphinxLogger.warning('verifyAscii has failed')
    throw e
  }
}

function ascii_to_hexa(str: string): string {
  const arr: string[] = []
  for (const c of str) {
    arr.push(Number(c.charCodeAt(0)).toString(16))
  }
  return arr.join('')
}
