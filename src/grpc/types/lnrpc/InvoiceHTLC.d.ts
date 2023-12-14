// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  InvoiceHTLCState as _lnrpc_InvoiceHTLCState,
  InvoiceHTLCState__Output as _lnrpc_InvoiceHTLCState__Output,
} from '../lnrpc/InvoiceHTLCState'
import type {
  AMP as _lnrpc_AMP,
  AMP__Output as _lnrpc_AMP__Output,
} from '../lnrpc/AMP'

export interface InvoiceHTLC {
  chan_id?: number | string | Long
  htlc_index?: number | string | Long
  amt_msat?: number | string | Long
  accept_height?: number
  accept_time?: number | string | Long
  resolve_time?: number | string | Long
  expiry_height?: number
  state?: _lnrpc_InvoiceHTLCState
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
  mpp_total_amt_msat?: number | string | Long
  amp?: _lnrpc_AMP | null
}

export interface InvoiceHTLC__Output {
  chan_id: string
  htlc_index: string
  amt_msat: string
  accept_height: number
  accept_time: string
  resolve_time: string
  expiry_height: number
  state: _lnrpc_InvoiceHTLCState__Output
  custom_records: { [key: number]: Buffer }
  mpp_total_amt_msat: string
  amp: _lnrpc_AMP__Output | null
}
