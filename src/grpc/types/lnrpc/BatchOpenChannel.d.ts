// Original file: proto/lightning.proto

import type {
  CommitmentType as _lnrpc_CommitmentType,
  CommitmentType__Output as _lnrpc_CommitmentType__Output,
} from '../lnrpc/CommitmentType'
import type { Long } from '@grpc/proto-loader'

export interface BatchOpenChannel {
  node_pubkey?: Buffer | Uint8Array | string
  local_funding_amount?: number | string | Long
  push_sat?: number | string | Long
  private?: boolean
  min_htlc_msat?: number | string | Long
  remote_csv_delay?: number
  close_address?: string
  pending_chan_id?: Buffer | Uint8Array | string
  commitment_type?: _lnrpc_CommitmentType
}

export interface BatchOpenChannel__Output {
  node_pubkey: Buffer
  local_funding_amount: string
  push_sat: string
  private: boolean
  min_htlc_msat: string
  remote_csv_delay: number
  close_address: string
  pending_chan_id: Buffer
  commitment_type: _lnrpc_CommitmentType__Output
}
