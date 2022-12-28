// Original file: proto/greenlight.proto

import type {
  Outpoint as _greenlight_Outpoint,
  Outpoint__Output as _greenlight_Outpoint__Output,
} from '../greenlight/Outpoint'

export interface FundChannelResponse {
  tx?: Buffer | Uint8Array | string
  outpoint?: _greenlight_Outpoint | null
  channel_id?: Buffer | Uint8Array | string
  close_to?: string
}

export interface FundChannelResponse__Output {
  tx: Buffer
  outpoint: _greenlight_Outpoint__Output | null
  channel_id: Buffer
  close_to: string
}
