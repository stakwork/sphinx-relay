// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Feature as _lnrpc_Feature,
  Feature__Output as _lnrpc_Feature__Output,
} from '../lnrpc/Feature'
import type {
  TimestampedError as _lnrpc_TimestampedError,
  TimestampedError__Output as _lnrpc_TimestampedError__Output,
} from '../lnrpc/TimestampedError'

// Original file: proto/lightning.proto

export const _lnrpc_Peer_SyncType = {
  UNKNOWN_SYNC: 'UNKNOWN_SYNC',
  ACTIVE_SYNC: 'ACTIVE_SYNC',
  PASSIVE_SYNC: 'PASSIVE_SYNC',
  PINNED_SYNC: 'PINNED_SYNC',
} as const

export type _lnrpc_Peer_SyncType =
  | 'UNKNOWN_SYNC'
  | 0
  | 'ACTIVE_SYNC'
  | 1
  | 'PASSIVE_SYNC'
  | 2
  | 'PINNED_SYNC'
  | 3

export type _lnrpc_Peer_SyncType__Output =
  (typeof _lnrpc_Peer_SyncType)[keyof typeof _lnrpc_Peer_SyncType]

export interface Peer {
  pub_key?: string
  address?: string
  bytes_sent?: number | string | Long
  bytes_recv?: number | string | Long
  sat_sent?: number | string | Long
  sat_recv?: number | string | Long
  inbound?: boolean
  ping_time?: number | string | Long
  sync_type?: _lnrpc_Peer_SyncType
  features?: { [key: number]: _lnrpc_Feature }
  errors?: _lnrpc_TimestampedError[]
  flap_count?: number
  last_flap_ns?: number | string | Long
  last_ping_payload?: Buffer | Uint8Array | string
}

export interface Peer__Output {
  pub_key: string
  address: string
  bytes_sent: string
  bytes_recv: string
  sat_sent: string
  sat_recv: string
  inbound: boolean
  ping_time: string
  sync_type: _lnrpc_Peer_SyncType__Output
  features: { [key: number]: _lnrpc_Feature__Output }
  errors: _lnrpc_TimestampedError__Output[]
  flap_count: number
  last_flap_ns: string
  last_ping_payload: Buffer
}
