// Original file: proto/walletkit.proto

import type { AddressType as _walletrpc_AddressType } from '../walletrpc/AddressType';

export interface AddrRequest {
  'account'?: (string);
  'type'?: (_walletrpc_AddressType | keyof typeof _walletrpc_AddressType);
  'change'?: (boolean);
}

export interface AddrRequest__Output {
  'account': (string);
  'type': (keyof typeof _walletrpc_AddressType);
  'change': (boolean);
}
