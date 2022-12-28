// Original file: proto/walletkit.proto

import type {
  Account as _walletrpc_Account,
  Account__Output as _walletrpc_Account__Output,
} from '../walletrpc/Account'

export interface ListAccountsResponse {
  accounts?: _walletrpc_Account[]
}

export interface ListAccountsResponse__Output {
  accounts: _walletrpc_Account__Output[]
}
