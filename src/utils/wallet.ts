

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

interface Outpoint {
  txid_str: string
}
export interface UTXO {
  address: string
  address_type: number
  amount_sat: number
  confirmations: number
  outpoint: Outpoint
}

export async function listUnspent():Promise<UTXO[]> {
  return new Promise(async (resolve, reject) => {
    let walletkit = await loadWalletKit()
    try {
      const opts = {min_confs:0,max_confs:10000}
      walletkit.listUnspent(opts, function(err, res){
        if (err || !(res&&res.utxos)) {
          reject(err)
        } else {
          resolve(res.utxos)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}