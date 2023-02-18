// Original file: proto/lightning.proto

import type {
  AddressType as _lnrpc_AddressType,
  AddressType__Output as _lnrpc_AddressType__Output,
} from '../lnrpc/AddressType'

export interface NewAddressRequest {
  type?: _lnrpc_AddressType
  account?: string
}

export interface NewAddressRequest__Output {
  type: _lnrpc_AddressType__Output
  account: string
}
