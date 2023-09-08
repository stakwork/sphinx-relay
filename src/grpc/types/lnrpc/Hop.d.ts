// Original file: proto/lightning.proto

import type {
  MPPRecord as _lnrpc_MPPRecord,
  MPPRecord__Output as _lnrpc_MPPRecord__Output,
} from '../lnrpc/MPPRecord'
import type {
  AMPRecord as _lnrpc_AMPRecord,
  AMPRecord__Output as _lnrpc_AMPRecord__Output,
} from '../lnrpc/AMPRecord'
import type { Long } from '@grpc/proto-loader'

export interface Hop {
  chan_id?: number | string | Long
  chan_capacity?: number | string | Long
  amt_to_forward?: number | string | Long
  fee?: number | string | Long
  expiry?: number
  amt_to_forward_msat?: number | string | Long
  fee_msat?: number | string | Long
  pub_key?: string
  tlv_payload?: boolean
  mpp_record?: _lnrpc_MPPRecord | null
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
  amp_record?: _lnrpc_AMPRecord | null
  metadata?: Buffer | Uint8Array | string
}

export interface Hop__Output {
  chan_id: string
  chan_capacity: string
  amt_to_forward: string
  fee: string
  expiry: number
  amt_to_forward_msat: string
  fee_msat: string
  pub_key: string
  tlv_payload: boolean
  mpp_record: _lnrpc_MPPRecord__Output | null
  custom_records: { [key: number]: Buffer }
  amp_record: _lnrpc_AMPRecord__Output | null
  metadata: Buffer
}
