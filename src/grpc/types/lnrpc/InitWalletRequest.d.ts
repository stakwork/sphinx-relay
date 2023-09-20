// Original file: proto/walletunlocker.proto

import type {
  ChanBackupSnapshot as _lnrpc_ChanBackupSnapshot,
  ChanBackupSnapshot__Output as _lnrpc_ChanBackupSnapshot__Output,
} from '../lnrpc/ChanBackupSnapshot'
import type {
  WatchOnly as _lnrpc_WatchOnly,
  WatchOnly__Output as _lnrpc_WatchOnly__Output,
} from '../lnrpc/WatchOnly'
import type { Long } from '@grpc/proto-loader'

export interface InitWalletRequest {
  wallet_password?: Buffer | Uint8Array | string
  cipher_seed_mnemonic?: string[]
  aezeed_passphrase?: Buffer | Uint8Array | string
  recovery_window?: number
  channel_backups?: _lnrpc_ChanBackupSnapshot | null
  stateless_init?: boolean
  extended_master_key?: string
  extended_master_key_birthday_timestamp?: number | string | Long
  watch_only?: _lnrpc_WatchOnly | null
  macaroon_root_key?: Buffer | Uint8Array | string
}

export interface InitWalletRequest__Output {
  wallet_password: Buffer
  cipher_seed_mnemonic: string[]
  aezeed_passphrase: Buffer
  recovery_window: number
  channel_backups: _lnrpc_ChanBackupSnapshot__Output | null
  stateless_init: boolean
  extended_master_key: string
  extended_master_key_birthday_timestamp: string
  watch_only: _lnrpc_WatchOnly__Output | null
  macaroon_root_key: Buffer
}
