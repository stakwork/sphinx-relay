// Original file: proto/greenlight.proto

import type { CloseChannelType as _greenlight_CloseChannelType } from '../greenlight/CloseChannelType';

export interface CloseChannelResponse {
  'close_type'?: (_greenlight_CloseChannelType | keyof typeof _greenlight_CloseChannelType);
  'tx'?: (Buffer | Uint8Array | string);
  'txid'?: (Buffer | Uint8Array | string);
}

export interface CloseChannelResponse__Output {
  'close_type': (keyof typeof _greenlight_CloseChannelType);
  'tx': (Buffer);
  'txid': (Buffer);
}
