// Original file: proto/walletkit.proto

import type { Account as _walletrpc_Account, Account__Output as _walletrpc_Account__Output } from '../walletrpc/Account';

export interface ImportAccountResponse {
  'account'?: (_walletrpc_Account | null);
  'dry_run_external_addrs'?: (string)[];
  'dry_run_internal_addrs'?: (string)[];
}

export interface ImportAccountResponse__Output {
  'account': (_walletrpc_Account__Output | null);
  'dry_run_external_addrs': (string)[];
  'dry_run_internal_addrs': (string)[];
}
