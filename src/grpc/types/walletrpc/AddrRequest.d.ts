// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'

export interface AddrRequest {
  account?: string
  type?: _walletrpc_AddressType
  change?: boolean
}

export interface AddrRequest__Output {
  account: string
  type: _walletrpc_AddressType__Output
  change: boolean
}
