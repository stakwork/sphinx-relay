// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'

export interface ListAccountsRequest {
  name?: string
  address_type?: _walletrpc_AddressType
}

export interface ListAccountsRequest__Output {
  name: string
  address_type: _walletrpc_AddressType__Output
}
