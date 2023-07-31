// Original file: proto/router.proto

import type {
  CircuitKey as _routerrpc_CircuitKey,
  CircuitKey__Output as _routerrpc_CircuitKey__Output,
} from '../routerrpc/CircuitKey'
import type { Long } from '@grpc/proto-loader'

export interface ForwardHtlcInterceptRequest {
  incoming_circuit_key?: _routerrpc_CircuitKey | null
  payment_hash?: Buffer | Uint8Array | string
  outgoing_amount_msat?: number | string | Long
  outgoing_expiry?: number
  incoming_amount_msat?: number | string | Long
  incoming_expiry?: number
  outgoing_requested_chan_id?: number | string | Long
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
  onion_blob?: Buffer | Uint8Array | string
  auto_fail_height?: number
}

export interface ForwardHtlcInterceptRequest__Output {
  incoming_circuit_key: _routerrpc_CircuitKey__Output | null
  payment_hash: Buffer
  outgoing_amount_msat: string
  outgoing_expiry: number
  incoming_amount_msat: string
  incoming_expiry: number
  outgoing_requested_chan_id: string
  custom_records: { [key: number]: Buffer }
  onion_blob: Buffer
  auto_fail_height: number
}
