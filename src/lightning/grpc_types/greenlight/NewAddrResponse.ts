// Original file: proto/greenlight.proto

import type { BtcAddressType as _greenlight_BtcAddressType } from '../greenlight/BtcAddressType';

export interface NewAddrResponse {
  'address_type'?: (_greenlight_BtcAddressType | keyof typeof _greenlight_BtcAddressType);
  'address'?: (string);
}

export interface NewAddrResponse__Output {
  'address_type': (keyof typeof _greenlight_BtcAddressType);
  'address': (string);
}
