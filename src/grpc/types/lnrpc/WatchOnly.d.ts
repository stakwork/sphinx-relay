// Original file: proto/walletunlocker.proto

import type { Long } from '@grpc/proto-loader'
import type {
  WatchOnlyAccount as _lnrpc_WatchOnlyAccount,
  WatchOnlyAccount__Output as _lnrpc_WatchOnlyAccount__Output,
} from '../lnrpc/WatchOnlyAccount'

export interface WatchOnly {
  master_key_birthday_timestamp?: number | string | Long
  master_key_fingerprint?: Buffer | Uint8Array | string
  accounts?: _lnrpc_WatchOnlyAccount[]
}

export interface WatchOnly__Output {
  master_key_birthday_timestamp: string
  master_key_fingerprint: Buffer
  accounts: _lnrpc_WatchOnlyAccount__Output[]
}
