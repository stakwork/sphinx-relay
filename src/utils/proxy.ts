import * as fs from 'fs'
import * as grpc from 'grpc'
import { loadConfig } from './config'
import {loadCredentials} from './lightning'

// var protoLoader = require('@grpc/proto-loader')
const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost'

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


export function isProxy(): boolean {
  return (config.proxy_lnd_port && config.proxy_macaroons_dir && config.proxy_tls_location) ? true : false
}

// var proxyLightningClient = <any>null;

export async function loadProxyLightning(childPubKey?:string) {
  // if (proxyLightningClient) {
  //   return proxyLightningClient
  // }
  try {
    let macname
    if(childPubKey && childPubKey.length===66) {
      macname = childPubKey
    } else {
      macname = await getProxyRootPubkey()
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