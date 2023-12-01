// Original file: proto/rpc_proxy.proto

import type {
  ChannelUpdate as _lnrpc_proxy_ChannelUpdate,
  ChannelUpdate__Output as _lnrpc_proxy_ChannelUpdate__Output,
} from '../lnrpc_proxy/ChannelUpdate'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/rpc_proxy.proto

export const _lnrpc_proxy_Failure_FailureCode = {
  RESERVED: 'RESERVED',
  INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS: 'INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS',
  INCORRECT_PAYMENT_AMOUNT: 'INCORRECT_PAYMENT_AMOUNT',
  FINAL_INCORRECT_CLTV_EXPIRY: 'FINAL_INCORRECT_CLTV_EXPIRY',
  FINAL_INCORRECT_HTLC_AMOUNT: 'FINAL_INCORRECT_HTLC_AMOUNT',
  FINAL_EXPIRY_TOO_SOON: 'FINAL_EXPIRY_TOO_SOON',
  INVALID_REALM: 'INVALID_REALM',
  EXPIRY_TOO_SOON: 'EXPIRY_TOO_SOON',
  INVALID_ONION_VERSION: 'INVALID_ONION_VERSION',
  INVALID_ONION_HMAC: 'INVALID_ONION_HMAC',
  INVALID_ONION_KEY: 'INVALID_ONION_KEY',
  AMOUNT_BELOW_MINIMUM: 'AMOUNT_BELOW_MINIMUM',
  FEE_INSUFFICIENT: 'FEE_INSUFFICIENT',
  INCORRECT_CLTV_EXPIRY: 'INCORRECT_CLTV_EXPIRY',
  CHANNEL_DISABLED: 'CHANNEL_DISABLED',
  TEMPORARY_CHANNEL_FAILURE: 'TEMPORARY_CHANNEL_FAILURE',
  REQUIRED_NODE_FEATURE_MISSING: 'REQUIRED_NODE_FEATURE_MISSING',
  REQUIRED_CHANNEL_FEATURE_MISSING: 'REQUIRED_CHANNEL_FEATURE_MISSING',
  UNKNOWN_NEXT_PEER: 'UNKNOWN_NEXT_PEER',
  TEMPORARY_NODE_FAILURE: 'TEMPORARY_NODE_FAILURE',
  PERMANENT_NODE_FAILURE: 'PERMANENT_NODE_FAILURE',
  PERMANENT_CHANNEL_FAILURE: 'PERMANENT_CHANNEL_FAILURE',
  EXPIRY_TOO_FAR: 'EXPIRY_TOO_FAR',
  MPP_TIMEOUT: 'MPP_TIMEOUT',
  INTERNAL_FAILURE: 'INTERNAL_FAILURE',
  UNKNOWN_FAILURE: 'UNKNOWN_FAILURE',
  UNREADABLE_FAILURE: 'UNREADABLE_FAILURE',
} as const

export type _lnrpc_proxy_Failure_FailureCode =
  | 'RESERVED'
  | 0
  | 'INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS'
  | 1
  | 'INCORRECT_PAYMENT_AMOUNT'
  | 2
  | 'FINAL_INCORRECT_CLTV_EXPIRY'
  | 3
  | 'FINAL_INCORRECT_HTLC_AMOUNT'
  | 4
  | 'FINAL_EXPIRY_TOO_SOON'
  | 5
  | 'INVALID_REALM'
  | 6
  | 'EXPIRY_TOO_SOON'
  | 7
  | 'INVALID_ONION_VERSION'
  | 8
  | 'INVALID_ONION_HMAC'
  | 9
  | 'INVALID_ONION_KEY'
  | 10
  | 'AMOUNT_BELOW_MINIMUM'
  | 11
  | 'FEE_INSUFFICIENT'
  | 12
  | 'INCORRECT_CLTV_EXPIRY'
  | 13
  | 'CHANNEL_DISABLED'
  | 14
  | 'TEMPORARY_CHANNEL_FAILURE'
  | 15
  | 'REQUIRED_NODE_FEATURE_MISSING'
  | 16
  | 'REQUIRED_CHANNEL_FEATURE_MISSING'
  | 17
  | 'UNKNOWN_NEXT_PEER'
  | 18
  | 'TEMPORARY_NODE_FAILURE'
  | 19
  | 'PERMANENT_NODE_FAILURE'
  | 20
  | 'PERMANENT_CHANNEL_FAILURE'
  | 21
  | 'EXPIRY_TOO_FAR'
  | 22
  | 'MPP_TIMEOUT'
  | 23
  | 'INTERNAL_FAILURE'
  | 997
  | 'UNKNOWN_FAILURE'
  | 998
  | 'UNREADABLE_FAILURE'
  | 999

export type _lnrpc_proxy_Failure_FailureCode__Output =
  (typeof _lnrpc_proxy_Failure_FailureCode)[keyof typeof _lnrpc_proxy_Failure_FailureCode]

export interface Failure {
  code?: _lnrpc_proxy_Failure_FailureCode
  channel_update?: _lnrpc_proxy_ChannelUpdate | null
  htlc_msat?: number | string | Long
  onion_sha_256?: Buffer | Uint8Array | string
  cltv_expiry?: number
  flags?: number
  failure_source_index?: number
  height?: number
}

export interface Failure__Output {
  code: _lnrpc_proxy_Failure_FailureCode__Output
  channel_update: _lnrpc_proxy_ChannelUpdate__Output | null
  htlc_msat: string
  onion_sha_256: Buffer
  cltv_expiry: number
  flags: number
  failure_source_index: number
  height: number
}
