// Original file: proto/walletkit.proto

import type { AddressType as _walletrpc_AddressType } from '../walletrpc/AddressType';

export interface ListAccountsRequest {
  'name'?: (string);
  'address_type'?: (_walletrpc_AddressType | keyof typeof _walletrpc_AddressType);
}

export interface ListAccountsRequest__Output {
  'name': (string);
  'address_type': (keyof typeof _walletrpc_AddressType);
}
