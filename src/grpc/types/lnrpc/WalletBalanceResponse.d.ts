// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  WalletAccountBalance as _lnrpc_WalletAccountBalance,
  WalletAccountBalance__Output as _lnrpc_WalletAccountBalance__Output,
} from '../lnrpc/WalletAccountBalance'

export interface WalletBalanceResponse {
  total_balance?: number | string | Long
  confirmed_balance?: number | string | Long
  unconfirmed_balance?: number | string | Long
  account_balance?: { [key: string]: _lnrpc_WalletAccountBalance }
  locked_balance?: number | string | Long
  reserved_balance_anchor_chan?: number | string | Long
}

export interface WalletBalanceResponse__Output {
  total_balance: string
  confirmed_balance: string
  unconfirmed_balance: string
  account_balance: { [key: string]: _lnrpc_WalletAccountBalance__Output }
  locked_balance: string
  reserved_balance_anchor_chan: string
}
