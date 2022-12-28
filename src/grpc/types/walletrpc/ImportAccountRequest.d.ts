// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'

export interface ImportAccountRequest {
  name?: string
  extended_public_key?: string
  master_key_fingerprint?: Buffer | Uint8Array | string
  address_type?: _walletrpc_AddressType
  dry_run?: boolean
}

export interface ImportAccountRequest__Output {
  name: string
  extended_public_key: string
  master_key_fingerprint: Buffer
  address_type: _walletrpc_AddressType__Output
  dry_run: boolean
}
