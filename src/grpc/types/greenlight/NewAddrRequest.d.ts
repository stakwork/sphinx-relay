// Original file: proto/greenlight.proto

import type {
  BtcAddressType as _greenlight_BtcAddressType,
  BtcAddressType__Output as _greenlight_BtcAddressType__Output,
} from '../greenlight/BtcAddressType'

export interface NewAddrRequest {
  address_type?: _greenlight_BtcAddressType
}

export interface NewAddrRequest__Output {
  address_type: _greenlight_BtcAddressType__Output
}
