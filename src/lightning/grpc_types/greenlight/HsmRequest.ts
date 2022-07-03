// Original file: proto/greenlight.proto

import type { HsmRequestContext as _greenlight_HsmRequestContext, HsmRequestContext__Output as _greenlight_HsmRequestContext__Output } from '../greenlight/HsmRequestContext';

export interface HsmRequest {
  'request_id'?: (number);
  'context'?: (_greenlight_HsmRequestContext | null);
  'raw'?: (Buffer | Uint8Array | string);
}

export interface HsmRequest__Output {
  'request_id': (number);
  'context': (_greenlight_HsmRequestContext__Output | null);
  'raw': (Buffer);
}
