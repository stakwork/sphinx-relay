// Original file: proto/greenlight.proto

import type {
  CloseChannelType as _greenlight_CloseChannelType,
  CloseChannelType__Output as _greenlight_CloseChannelType__Output,
} from '../greenlight/CloseChannelType'

export interface CloseChannelResponse {
  close_type?: _greenlight_CloseChannelType
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
}

export interface CloseChannelResponse__Output {
  close_type: _greenlight_CloseChannelType__Output
  tx: Buffer
  txid: Buffer
}
