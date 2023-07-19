// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  RouteHint as _lnrpc_RouteHint,
  RouteHint__Output as _lnrpc_RouteHint__Output,
} from '../lnrpc/RouteHint'
import type {
  Feature as _lnrpc_Feature,
  Feature__Output as _lnrpc_Feature__Output,
} from '../lnrpc/Feature'

export interface PayReq {
  destination?: string
  payment_hash?: string
  num_satoshis?: number | string | Long
  timestamp?: number | string | Long
  expiry?: number | string | Long
  description?: string
  description_hash?: string
  fallback_addr?: string
  cltv_expiry?: number | string | Long
  route_hints?: _lnrpc_RouteHint[]
  payment_addr?: Buffer | Uint8Array | string
  num_msat?: number | string | Long
  features?: { [key: number]: _lnrpc_Feature }
}

export interface PayReq__Output {
  destination: string
  payment_hash: string
  num_satoshis: string
  timestamp: string
  expiry: string
  description: string
  description_hash: string
  fallback_addr: string
  cltv_expiry: string
  route_hints: _lnrpc_RouteHint__Output[]
  payment_addr: Buffer
  num_msat: string
  features: { [key: number]: _lnrpc_Feature__Output }
}
