// Original file: proto/rpc_proxy.proto

import type {
  Amount as _lnrpc_proxy_Amount,
  Amount__Output as _lnrpc_proxy_Amount__Output,
} from '../lnrpc_proxy/Amount'
import type { Long } from '@grpc/proto-loader'

export interface ChannelBalanceResponse {
  balance?: number | string | Long
  pending_open_balance?: number | string | Long
  local_balance?: _lnrpc_proxy_Amount | null
  remote_balance?: _lnrpc_proxy_Amount | null
  unsettled_local_balance?: _lnrpc_proxy_Amount | null
  unsettled_remote_balance?: _lnrpc_proxy_Amount | null
  pending_open_local_balance?: _lnrpc_proxy_Amount | null
  pending_open_remote_balance?: _lnrpc_proxy_Amount | null
}

export interface ChannelBalanceResponse__Output {
  balance: string
  pending_open_balance: string
  local_balance: _lnrpc_proxy_Amount__Output | null
  remote_balance: _lnrpc_proxy_Amount__Output | null
  unsettled_local_balance: _lnrpc_proxy_Amount__Output | null
  unsettled_remote_balance: _lnrpc_proxy_Amount__Output | null
  pending_open_local_balance: _lnrpc_proxy_Amount__Output | null
  pending_open_remote_balance: _lnrpc_proxy_Amount__Output | null
}
