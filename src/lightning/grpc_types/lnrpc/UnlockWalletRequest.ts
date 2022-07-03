// Original file: proto/walletunlocker.proto

import type { ChanBackupSnapshot as _lnrpc_ChanBackupSnapshot, ChanBackupSnapshot__Output as _lnrpc_ChanBackupSnapshot__Output } from '../lnrpc/ChanBackupSnapshot';

export interface UnlockWalletRequest {
  'wallet_password'?: (Buffer | Uint8Array | string);
  'recovery_window'?: (number);
  'channel_backups'?: (_lnrpc_ChanBackupSnapshot | null);
  'stateless_init'?: (boolean);
}

export interface UnlockWalletRequest__Output {
  'wallet_password': (Buffer);
  'recovery_window': (number);
  'channel_backups': (_lnrpc_ChanBackupSnapshot__Output | null);
  'stateless_init': (boolean);
}
