// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  OutputDetail as _lnrpc_OutputDetail,
  OutputDetail__Output as _lnrpc_OutputDetail__Output,
} from '../lnrpc/OutputDetail'
import type {
  PreviousOutPoint as _lnrpc_PreviousOutPoint,
  PreviousOutPoint__Output as _lnrpc_PreviousOutPoint__Output,
} from '../lnrpc/PreviousOutPoint'

export interface Transaction {
  tx_hash?: string
  amount?: number | string | Long
  num_confirmations?: number
  block_hash?: string
  block_height?: number
  time_stamp?: number | string | Long
  total_fees?: number | string | Long
  dest_addresses?: string[]
  raw_tx_hex?: string
  label?: string
  output_details?: _lnrpc_OutputDetail[]
  previous_outpoints?: _lnrpc_PreviousOutPoint[]
}

export interface Transaction__Output {
  tx_hash: string
  amount: string
  num_confirmations: number
  block_hash: string
  block_height: number
  time_stamp: string
  total_fees: string
  dest_addresses: string[]
  raw_tx_hex: string
  label: string
  output_details: _lnrpc_OutputDetail__Output[]
  previous_outpoints: _lnrpc_PreviousOutPoint__Output[]
}
