// Original file: proto/lightning.proto

import type {
  FundingShim as _lnrpc_FundingShim,
  FundingShim__Output as _lnrpc_FundingShim__Output,
} from '../lnrpc/FundingShim'
import type {
  CommitmentType as _lnrpc_CommitmentType,
  CommitmentType__Output as _lnrpc_CommitmentType__Output,
} from '../lnrpc/CommitmentType'
import type { Long } from '@grpc/proto-loader'

export interface OpenChannelRequest {
  sat_per_vbyte?: number | string | Long
  node_pubkey?: Buffer | Uint8Array | string
  node_pubkey_string?: string
  local_funding_amount?: number | string | Long
  push_sat?: number | string | Long
  target_conf?: number
  sat_per_byte?: number | string | Long
  private?: boolean
  min_htlc_msat?: number | string | Long
  remote_csv_delay?: number
  min_confs?: number
  spend_unconfirmed?: boolean
  close_address?: string
  funding_shim?: _lnrpc_FundingShim | null
  remote_max_value_in_flight_msat?: number | string | Long
  remote_max_htlcs?: number
  max_local_csv?: number
  commitment_type?: _lnrpc_CommitmentType
  zero_conf?: boolean
  scid_alias?: boolean
  base_fee?: number | string | Long
  fee_rate?: number | string | Long
  use_base_fee?: boolean
  use_fee_rate?: boolean
  remote_chan_reserve_sat?: number | string | Long
}

export interface OpenChannelRequest__Output {
  sat_per_vbyte: string
  node_pubkey: Buffer
  node_pubkey_string: string
  local_funding_amount: string
  push_sat: string
  target_conf: number
  sat_per_byte: string
  private: boolean
  min_htlc_msat: string
  remote_csv_delay: number
  min_confs: number
  spend_unconfirmed: boolean
  close_address: string
  funding_shim: _lnrpc_FundingShim__Output | null
  remote_max_value_in_flight_msat: string
  remote_max_htlcs: number
  max_local_csv: number
  commitment_type: _lnrpc_CommitmentType__Output
  zero_conf: boolean
  scid_alias: boolean
  base_fee: string
  fee_rate: string
  use_base_fee: boolean
  use_fee_rate: boolean
  remote_chan_reserve_sat: string
}
