// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'

export interface ImportPublicKeyRequest {
  public_key?: Buffer | Uint8Array | string
  address_type?: _walletrpc_AddressType
}

export interface ImportPublicKeyRequest__Output {
  public_key: Buffer
  address_type: _walletrpc_AddressType__Output
}
