// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader';

export interface TlvField {
  'type'?: (number | string | Long);
  'value'?: (Buffer | Uint8Array | string);
}

export interface TlvField__Output {
  'type': (string);
  'value': (Buffer);
}
