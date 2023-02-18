// Original file: proto/walletkit.proto

import type {
  AddressType as _walletrpc_AddressType,
  AddressType__Output as _walletrpc_AddressType__Output,
} from '../walletrpc/AddressType'

export interface Account {
  name?: string
  address_type?: _walletrpc_AddressType
  extended_public_key?: string
  master_key_fingerprint?: Buffer | Uint8Array | string
  derivation_path?: string
  external_key_count?: number
  internal_key_count?: number
  watch_only?: boolean
}

export interface Account__Output {
  name: string
  address_type: _walletrpc_AddressType__Output
  extended_public_key: string
  master_key_fingerprint: Buffer
  derivation_path: string
  external_key_count: number
  internal_key_count: number
  watch_only: boolean
}
