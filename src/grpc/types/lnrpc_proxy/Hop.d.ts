// Original file: proto/rpc_proxy.proto

import type {
  MPPRecord as _lnrpc_proxy_MPPRecord,
  MPPRecord__Output as _lnrpc_proxy_MPPRecord__Output,
} from '../lnrpc_proxy/MPPRecord'
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
  mpp_record?: _lnrpc_proxy_MPPRecord | null
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
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
  mpp_record: _lnrpc_proxy_MPPRecord__Output | null
  custom_records: { [key: number]: Buffer }
}
