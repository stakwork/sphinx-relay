// Original file: proto/walletkit.proto

import type {
  AccountWithAddresses as _walletrpc_AccountWithAddresses,
  AccountWithAddresses__Output as _walletrpc_AccountWithAddresses__Output,
} from '../walletrpc/AccountWithAddresses'

export interface ListAddressesResponse {
  account_with_addresses?: _walletrpc_AccountWithAddresses[]
}

export interface ListAddressesResponse__Output {
  account_with_addresses: _walletrpc_AccountWithAddresses__Output[]
}
