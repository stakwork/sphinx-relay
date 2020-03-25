import * as ByteBuffer from 'bytebuffer'
import * as fs from 'fs'
import * as grpc from 'grpc'
import { sleep } from '../helpers';
import * as sha from 'js-sha256'
import * as crypto from 'crypto'
// var protoLoader = require('@grpc/proto-loader')
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/app.json')[env];

const LND_KEYSEND_KEY = 5482373484
const SPHINX_CUSTOM_RECORD_KEY = 133773310

var lightningClient = <any> null;
var walletUnlocker  = <any> null;

const loadCredentials = () => {
  var lndCert = fs.readFileSync(config.tls_location);
  var sslCreds = grpc.credentials.createSsl(lndCert);
  var m = fs.readFileSync(config.macaroon_location);
	var macaroon = m.toString('hex');
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
//     lightningClient = new lnrpc.Lightning(config.node_ip + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }

const loadLightning = () => {
  if (lightningClient) {
    return lightningClient
  } else {
    try{
      var credentials = loadCredentials()
      var lnrpcDescriptor = grpc.load("rpc.proto");
      var lnrpc: any = lnrpcDescriptor.lnrpc
      lightningClient = new lnrpc.Lightning(config.node_ip + ':' + config.lnd_port, credentials);
      return lightningClient
    } catch(e) {
      throw e
    }
  }
}

const loadWalletUnlocker = () => {
  if (walletUnlocker) {
    return walletUnlocker
  } else {
    var credentials = loadCredentials()
    try{
      var lnrpcDescriptor = grpc.load("rpc.proto");
      var lnrpc: any = lnrpcDescriptor.lnrpc
      walletUnlocker = new lnrpc.WalletUnlocker(config.node_ip + ':' + config.lnd_port, credentials);
      return walletUnlocker
    } catch(e) {
      console.log(e)
    }
  }
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

const keysend = (opts) => {
  return new Promise(async function(resolve, reject) {
    let lightning = await loadLightning()

    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    const options = {
      amt: opts.amt,
      final_cltv_delta: 10,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
        [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data),
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features:[9],
    }
    const call = lightning.sendPayment()
    call.on('data', function(payment) {
      if(payment.payment_error){
        reject(payment.payment_error)
      } else {
        resolve(payment)
      }
    })
    call.on('error', function(err) {
      reject(err)
    })
    call.write(options)
  })
}

const MAX_MSG_LENGTH = 972 // 1146 - 20
async function keysendMessage(opts) {
  return new Promise(async function(resolve, reject) {
    if(!opts.data || typeof opts.data!=='string') {
      return reject('string plz')
    }
    if(opts.data.length<MAX_MSG_LENGTH){
      try {
        const res = await keysend(opts)
        resolve(res)
      } catch(e) {
        reject(e)
      }
      return
    }
    // too long! need to send serial
    const n = Math.ceil(opts.data.length / MAX_MSG_LENGTH)
    let success = false
    let fail = false
    let res:any = null
    const ts = new Date().valueOf()
    await asyncForEach(Array.from(Array(n)), async(u,i)=> {
      const spliti = Math.ceil(opts.data.length/n)
      const m = opts.data.substr(i*spliti, spliti)
      try {
        res = await keysend({...opts,
          data: `${ts}_${i}_${n}_${m}`
        })
        success = true
        await sleep(432)
      } catch(e) {
        console.log(e)
        fail = true
      }
    })
    if(success && !fail) {
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
  } catch(e) {
    throw e
  }
}

function listInvoices() {  
  return new Promise(async(resolve, reject)=> {
    const lightning = await loadLightning()
    lightning.listInvoices({
      num_max_invoices:100000,
      reversed:true,
    }, (err, response) => {
      if(!err) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

function listPayments() {  
  return new Promise(async(resolve, reject)=> {
    const lightning = await loadLightning()
    lightning.listPayments({}, (err, response) => {
      if(!err) {
        resolve(response)
      } else {
        reject(err)
      }
    });
  })
}

const signMessage = (msg) => {
  return new Promise(async(resolve, reject)=> {
    let lightning = await loadLightning()
    try {
      const options = {msg:ByteBuffer.fromHex(msg)}
      lightning.signMessage(options, function(err,sig){
        if(err || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

const signBuffer = (msg) => {
  return new Promise(async (resolve, reject)=> {
    let lightning = await loadLightning()
    try {
      const options = {msg}
      lightning.signMessage(options, function(err,sig){
        if(err || !sig.signature) {
          reject(err)
        } else {
          resolve(sig.signature)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

const verifyMessage = (msg,sig) => {
  return new Promise(async(resolve, reject)=> {
    let lightning = await loadLightning()
    try {
      const options = {
        msg:ByteBuffer.fromHex(msg),
        signature:sig,
      }
      console.log(options)
      lightning.verifyMessage(options, function(err,res){
        if(err || !res.pubkey) {
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

async function checkConnection(){
	return new Promise((resolve,reject)=>{
		const lightning = loadLightning()
		lightning.getInfo({}, function(err, response) {
			if (err == null) {	
				resolve(response)
			} else {
				reject(err)
			}
		});
	})
}

function ascii_to_hexa(str){
	var arr1 = <string[]> [];
	for (var n = 0, l = str.length; n < l; n ++) {
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
  keysendMessage,
  signMessage,
  verifyMessage,
  signAscii,
  signBuffer,
  LND_KEYSEND_KEY,
  SPHINX_CUSTOM_RECORD_KEY,
  listInvoices,
  listPayments,
  checkConnection,
}
