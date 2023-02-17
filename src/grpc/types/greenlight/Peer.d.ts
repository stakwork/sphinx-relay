// Original file: proto/greenlight.proto

import type {
  Address as _greenlight_Address,
  Address__Output as _greenlight_Address__Output,
} from '../greenlight/Address'
import type {
  Channel as _greenlight_Channel,
  Channel__Output as _greenlight_Channel__Output,
} from '../greenlight/Channel'

export interface Peer {
  id?: Buffer | Uint8Array | string
  connected?: boolean
  addresses?: _greenlight_Address[]
  features?: string
  channels?: _greenlight_Channel[]
}

export interface Peer__Output {
  id: Buffer
  connected: boolean
  addresses: _greenlight_Address__Output[]
  features: string
  channels: _greenlight_Channel__Output[]
}
