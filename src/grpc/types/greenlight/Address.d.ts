// Original file: proto/greenlight.proto

import type {
  NetAddressType as _greenlight_NetAddressType,
  NetAddressType__Output as _greenlight_NetAddressType__Output,
} from '../greenlight/NetAddressType'

export interface Address {
  type?: _greenlight_NetAddressType
  addr?: string
  port?: number
}

export interface Address__Output {
  type: _greenlight_NetAddressType__Output
  addr: string
  port: number
}
