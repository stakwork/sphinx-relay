// Original file: proto/greenlight.proto

import type { BtcAddressType as _greenlight_BtcAddressType } from '../greenlight/BtcAddressType';

export interface NewAddrRequest {
  'address_type'?: (_greenlight_BtcAddressType | keyof typeof _greenlight_BtcAddressType);
}

export interface NewAddrRequest__Output {
  'address_type': (keyof typeof _greenlight_BtcAddressType);
}
