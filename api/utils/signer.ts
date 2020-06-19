
import * as grpc from 'grpc'
import {loadCredentials} from './lightning'
import * as path from 'path'
import * as ByteBuffer from 'bytebuffer'

// var protoLoader = require('@grpc/proto-loader')
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname,'../../config/app.json'))[env]

var signerClient = <any> null;

export const loadSigner = () => {
  if (signerClient) {
    return signerClient
  } else {
    try{
      var credentials = loadCredentials()
      var lnrpcDescriptor = grpc.load("signer.proto");
      var signer: any = lnrpcDescriptor.signrpc
      signerClient = new signer.Signer(config.node_ip + ':' + config.lnd_port, credentials);
      return signerClient
    } catch(e) {
      throw e
    }
  }
}

export const signMessage = (msg) => {
  return new Promise(async(resolve, reject)=> {
    let signer = await loadSigner()
    try {
      const options = {
        msg:ByteBuffer.fromHex(msg),
        key_loc:{key_family:6, key_index:0},
      }
      signer.signMessage(options, function(err,sig){
        if(err || !sig.signature) {
          reject(err)
        } else {
          const buf = ByteBuffer.wrap(sig.signature);
          resolve(buf.toBase64())
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

export const signBuffer = (msg) => {
  return new Promise(async (resolve, reject)=> {
    let signer = await loadSigner()
    try {
      const options = {msg}
      signer.signMessage(options, function(err,sig){
        if(err || !sig.signature) {
          reject(err)
        } else {
          const buf = ByteBuffer.wrap(sig.signature);
          resolve(buf.toBase64())
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

function verifyMessage(msg,sig,pubkey): Promise<{[k:string]:any}> {
  return new Promise(async(resolve, reject)=> {
    let signer = await loadSigner()
    if(sig.length!==96) {
      return reject('invalid sig')
    }
    if(pubkey.length!==66) {
      return reject('invalid pubkey')
    }
    try {
      const options = {
        msg:ByteBuffer.fromHex(msg),
        signature:ByteBuffer.fromBase64(sig),
        pubkey:ByteBuffer.fromHex(pubkey),
      }
      signer.verifyMessage(options, function(err,res){
        if(err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

export async function signAscii(ascii) {
  try {
    const sig = await signMessage(ascii_to_hexa(ascii))
    return sig
  } catch(e) {
    throw e
  }
}

export async function verifyAscii(ascii:string,sig:Buffer,pubkey:string): Promise<{[k:string]:any}>{
  try {
    const r = await verifyMessage(ascii_to_hexa(ascii),sig,pubkey)
    return r
  } catch(e) {
    throw e
  }
}

function ascii_to_hexa(str){
	var arr1 = <string[]> [];
	for (var n = 0, l = str.length; n < l; n ++) {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
}
