// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'
import type {
  AddressProperty as _walletrpc_AddressProperty,
  AddressProperty__Output as _walletrpc_AddressProperty__Output,
} from '../walletrpc/AddressProperty'

export interface AccountWithAddresses {
  name?: string
  address_type?: _walletrpc_AddressType
  derivation_path?: string
  addresses?: _walletrpc_AddressProperty[]
}

export interface AccountWithAddresses__Output {
  name: string
  address_type: _walletrpc_AddressType__Output
  derivation_path: string
  addresses: _walletrpc_AddressProperty__Output[]
}
