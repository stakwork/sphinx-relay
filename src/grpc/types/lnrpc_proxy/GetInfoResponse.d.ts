// Original file: proto/rpc_proxy.proto

import type {
  Chain as _lnrpc_proxy_Chain,
  Chain__Output as _lnrpc_proxy_Chain__Output,
} from '../lnrpc_proxy/Chain'
import type {
  Feature as _lnrpc_proxy_Feature,
  Feature__Output as _lnrpc_proxy_Feature__Output,
} from '../lnrpc_proxy/Feature'
import type { Long } from '@grpc/proto-loader'

export interface GetInfoResponse {
  identity_pubkey?: string
  alias?: string
  num_pending_channels?: number
  num_active_channels?: number
  num_peers?: number
  block_height?: number
  block_hash?: string
  synced_to_chain?: boolean
  testnet?: boolean
  uris?: string[]
  best_header_timestamp?: number | string | Long
  version?: string
  num_inactive_channels?: number
  chains?: _lnrpc_proxy_Chain[]
  color?: string
  synced_to_graph?: boolean
  features?: { [key: number]: _lnrpc_proxy_Feature }
  commit_hash?: string
}

export interface GetInfoResponse__Output {
  identity_pubkey: string
  alias: string
  num_pending_channels: number
  num_active_channels: number
  num_peers: number
  block_height: number
  block_hash: string
  synced_to_chain: boolean
  testnet: boolean
  uris: string[]
  best_header_timestamp: string
  version: string
  num_inactive_channels: number
  chains: _lnrpc_proxy_Chain__Output[]
  color: string
  synced_to_graph: boolean
  features: { [key: number]: _lnrpc_proxy_Feature__Output }
  commit_hash: string
}
