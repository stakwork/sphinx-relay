// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface ListpeersPeersChannelsInflight {
  funding_txid?: Buffer | Uint8Array | string
  funding_outnum?: number
  feerate?: string
  total_funding_msat?: _cln_Amount | null
  our_funding_msat?: _cln_Amount | null
  scratch_txid?: Buffer | Uint8Array | string
}

export interface ListpeersPeersChannelsInflight__Output {
  funding_txid: Buffer
  funding_outnum: number
  feerate: string
  total_funding_msat: _cln_Amount__Output | null
  our_funding_msat: _cln_Amount__Output | null
  scratch_txid: Buffer
}
