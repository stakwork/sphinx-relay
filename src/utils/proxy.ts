import * as fs from 'fs'
import * as grpc from 'grpc'
import { loadConfig } from './config'
import {loadCredentials} from './lightning'
import { models } from '../models'
import fetch from 'node-fetch'
import {logging} from './logger'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost'

export function isProxy(): boolean {
  return (config.proxy_lnd_port && config.proxy_macaroons_dir && config.proxy_tls_location) ? true : false
}

export function genUsersInterval(ms) {
  if(!isProxy()) return
  setTimeout(()=>{ // so it starts a bit later than pingHub
    setInterval(generateNewUsers, ms)
  }, 2000) 
}

const NEW_USER_NUM = (config.proxy_new_nodes || config.proxy_new_nodes===0) ? config.proxy_new_nodes : 2
const SATS_PER_USER = config.proxy_initial_sats || 5000
// isOwner users with no authToken
export async function generateNewUsers(){
  if(!isProxy()) {
    if(logging.Proxy) console.log("[proxy] not proxy");
    return
  }
  const newusers = await models.Contact.findAll({where:{isOwner:true,authToken:null}})
  if(newusers.length>=NEW_USER_NUM) {
    if(logging.Proxy) console.log("[proxy] already have new users");
    return // we already have the mimimum
  }
  const n1 = NEW_USER_NUM-newusers.length

  const virtualBal = await getProxyTotalBalance()
  if(!virtualBal) {
    if(logging.Proxy) console.log("[proxy] no virtual balance");
    return 
  }
  const realBal = await getProxyLNDBalance()

  let availableBalance = realBal - virtualBal
  if(availableBalance<SATS_PER_USER) availableBalance=1
  const n2 = Math.floor(availableBalance/SATS_PER_USER)
  const n = Math.min(n1,n2)

  if(!n) {
    if(logging.Proxy) console.log("[proxy] not enough sats");
    return
  }
  console.log('=> gen new users:', n)
  const arr = new Array(n)
  const rootpk = await getProxyRootPubkey()
  await asyncForEach(arr, async ()=>{
    await generateNewUser(rootpk)
  })
}

const adminURL = config.proxy_admin_url ? (config.proxy_admin_url+'/') : 'http://localhost:5555/'
export async function generateNewUser(rootpk: string){
  try {
    const r = await fetch(adminURL + 'generate', {
      method:'POST',
      headers:{'x-admin-token':config.proxy_admin_token}
    })
    const j = await r.json()
    const contact = {
      publicKey: j.pubkey,
      routeHint: `${rootpk}:${j.channel}`,
      isOwner: true,
      authToken: null
    }
    const created = await models.Contact.create(contact)
    // set tenant to self!
    created.update({tenant:created.id})
    console.log("=> CREATED OWNER:", created.dataValues)
  } catch(e) {
    console.log('=> could not gen new user', e)
  }
}

// "total" is in msats
export async function getProxyTotalBalance(){
  try {
    const r = await fetch(adminURL + 'balances', {
      method:'GET',
      headers:{'x-admin-token':config.proxy_admin_token}
    })
    const j = await r.json()
    return j.total ? Math.floor(j.total/1000) : 0
  } catch(e) {
    return 0
  }
}

export function loadProxyCredentials(macPrefix: string) {
  var lndCert = fs.readFileSync(config.proxy_tls_location);
  var sslCreds = grpc.credentials.createSsl(lndCert);
  const m = fs.readFileSync(config.proxy_macaroons_dir + '/' + macPrefix + '.macaroon')
  const macaroon = m.toString('hex');
  var metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon)
  var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    callback(null, metadata);
  });

  return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
}

export async function loadProxyLightning(ownerPubkey?:string) {
  try {
    let macname
    if(ownerPubkey && ownerPubkey.length===66) {
      macname = ownerPubkey
    } else {
      try {
        macname = await getProxyRootPubkey()
      } catch(e) {

      }
    }
    var credentials = loadProxyCredentials(macname)
    var lnrpcDescriptor = grpc.load("proto/rpc_proxy.proto");
    var lnrpc: any = lnrpcDescriptor.lnrpc_proxy
    const the = new lnrpc.Lightning(PROXY_LND_IP + ':' + config.proxy_lnd_port, credentials);
    return the
  } catch(e) {
    console.log("ERROR in loadProxyLightning", e)
  }
}

var proxyRootPubkey = ''

function getProxyRootPubkey(): Promise<string> {
  return new Promise((resolve,reject)=>{
    if(proxyRootPubkey) {
      resolve(proxyRootPubkey)
      return
    }
    // normal client, to get pubkey of LND
    var credentials = loadCredentials()
    var lnrpcDescriptor = grpc.load("proto/rpc.proto");
    var lnrpc: any = lnrpcDescriptor.lnrpc
    var lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
    lc.getInfo({}, function (err, response) {
      if (err == null) {
        proxyRootPubkey = response.identity_pubkey
        resolve(proxyRootPubkey)
      } else {
        reject("CANT GET ROOT KEY")
      }
    });
  })
}

function getProxyLNDBalance(): Promise<number> {
  return new Promise((resolve,reject)=>{
    // normal client, to get pubkey of LND
    var credentials = loadCredentials()
    var lnrpcDescriptor = grpc.load("proto/rpc.proto");
    var lnrpc: any = lnrpcDescriptor.lnrpc
    var lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
    lc.channelBalance({}, function (err, response) {
      if (err == null) {
        lc.listChannels({}, function (err, channelList) {
          if (err == null) {
            const { channels } = channelList
            const reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0)
            const balance = parseInt(response.balance) - reserve
            resolve(balance)
          } else {
            reject(err)
          }
        });
      } else {
        reject(err)
      }
    });
  })
}


async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}