// Original file: proto/greenlight.proto

import type {
  BtcAddressType as _greenlight_BtcAddressType,
  BtcAddressType__Output as _greenlight_BtcAddressType__Output,
} from '../greenlight/BtcAddressType'

export interface NewAddrResponse {
  address_type?: _greenlight_BtcAddressType
  address?: string
}

export interface NewAddrResponse__Output {
  address_type: _greenlight_BtcAddressType__Output
  address: string
}
