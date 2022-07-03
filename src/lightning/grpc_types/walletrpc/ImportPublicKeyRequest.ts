// Original file: proto/walletkit.proto

import type { AddressType as _walletrpc_AddressType } from '../walletrpc/AddressType';

export interface ImportPublicKeyRequest {
  'public_key'?: (Buffer | Uint8Array | string);
  'address_type'?: (_walletrpc_AddressType | keyof typeof _walletrpc_AddressType);
}

export interface ImportPublicKeyRequest__Output {
  'public_key': (Buffer);
  'address_type': (keyof typeof _walletrpc_AddressType);
}
