

import * as grpc from 'grpc'
import { loadCredentials } from './lightning'
import {loadConfig} from './config'

const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'

let walletClient

export const loadWalletKit = () => {
  if (walletClient) {
    return walletClient
  } else {
    try {
      var credentials = loadCredentials()
      var lnrpcDescriptor = grpc.load("proto/walletkit.proto");
      var walletkit: any = lnrpcDescriptor.walletrpc
      walletClient = new walletkit.WalletKit(LND_IP + ':' + config.lnd_port, credentials);
      return walletClient
    } catch (e) {
      throw e
    }
  }
}

export const listUnspent = () => {
  return new Promise(async (resolve, reject) => {
    let walletkit = await loadWalletKit()
    try {
      const opts = {min_confs:1,max_confs:100}
      walletkit.listUnspent(opts, function(err, res){
        if (err) {
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