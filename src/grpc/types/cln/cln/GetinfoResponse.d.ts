// Original file: proto/cln/node.proto

import type {
  GetinfoOur_features as _cln_GetinfoOur_features,
  GetinfoOur_features__Output as _cln_GetinfoOur_features__Output,
} from '../cln/GetinfoOur_features'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  GetinfoAddress as _cln_GetinfoAddress,
  GetinfoAddress__Output as _cln_GetinfoAddress__Output,
} from '../cln/GetinfoAddress'
import type {
  GetinfoBinding as _cln_GetinfoBinding,
  GetinfoBinding__Output as _cln_GetinfoBinding__Output,
} from '../cln/GetinfoBinding'

export interface GetinfoResponse {
  id?: Buffer | Uint8Array | string
  alias?: string
  color?: Buffer | Uint8Array | string
  num_peers?: number
  num_pending_channels?: number
  num_active_channels?: number
  num_inactive_channels?: number
  version?: string
  lightning_dir?: string
  our_features?: _cln_GetinfoOur_features | null
  blockheight?: number
  network?: string
  fees_collected_msat?: _cln_Amount | null
  address?: _cln_GetinfoAddress[]
  binding?: _cln_GetinfoBinding[]
  warning_bitcoind_sync?: string
  warning_lightningd_sync?: string
  _our_features?: 'our_features'
  _warning_bitcoind_sync?: 'warning_bitcoind_sync'
  _warning_lightningd_sync?: 'warning_lightningd_sync'
}

export interface GetinfoResponse__Output {
  id: Buffer
  alias: string
  color: Buffer
  num_peers: number
  num_pending_channels: number
  num_active_channels: number
  num_inactive_channels: number
  version: string
  lightning_dir: string
  our_features?: _cln_GetinfoOur_features__Output | null
  blockheight: number
  network: string
  fees_collected_msat: _cln_Amount__Output | null
  address: _cln_GetinfoAddress__Output[]
  binding: _cln_GetinfoBinding__Output[]
  warning_bitcoind_sync?: string
  warning_lightningd_sync?: string
  _our_features: 'our_features'
  _warning_bitcoind_sync: 'warning_bitcoind_sync'
  _warning_lightningd_sync: 'warning_lightningd_sync'
}
