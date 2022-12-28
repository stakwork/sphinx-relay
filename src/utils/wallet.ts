import { loadProto } from '../grpc/proto'
import { WalletKitClient } from '../grpc/types/walletrpc/WalletKit'
import * as Lightning from '../grpc/lightning'
import { loadConfig } from './config'
import { sphinxLogger } from './logger'

const config = loadConfig()
const LND_IP = config.lnd_ip || 'localhost'

let walletClient: WalletKitClient | undefined

export function loadWalletKit(): WalletKitClient {
  if (walletClient) {
    return walletClient
  } else {
    try {
      const credentials = Lightning.loadCredentials()
      const lnrpcDescriptor = loadProto('walletkit')
      const walletkit = lnrpcDescriptor.walletrpc
      walletClient = new walletkit.WalletKit(
        LND_IP + ':' + config.lnd_port,
        credentials
      )
      return walletClient
    } catch (e) {
      sphinxLogger.warning(`unable to loadWalletKit`)
      throw e
    }
  }
}

enum AddressType {
  WITNESS_PUBKEY_HASH = 0,
  NESTED_PUBKEY_HASH = 1,
  UNUSED_WITNESS_PUBKEY_HASH = 2,
  UNUSED_NESTED_PUBKEY_HASH = 3,
  TAPROOT_PUBKEY = 4,
  UNUSED_TAPROOT_PUBKEY = 5,
}

interface Outpoint {
  txid_bytes: Buffer
  txid_str: string
  output_index: number
}

export interface UTXO {
  address_type: keyof typeof AddressType
  address: string
  amount_sat: string
  pk_script: string
  outpoint: Outpoint | null
  confirmations: string
}

export async function listUnspent(): Promise<UTXO[]> {
  return new Promise((resolve, reject) => {
    const walletkit = loadWalletKit()
    try {
      const opts = { min_confs: 0, max_confs: 10000 }
      walletkit.listUnspent(opts, function (err, res) {
        if (err || !(res && res.utxos)) {
          reject(err)
        } else {
          resolve(res.utxos)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
