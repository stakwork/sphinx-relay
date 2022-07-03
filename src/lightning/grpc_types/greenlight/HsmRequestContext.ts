// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader';

export interface HsmRequestContext {
  'node_id'?: (Buffer | Uint8Array | string);
  'dbid'?: (number | string | Long);
  'capabilities'?: (number | string | Long);
}

export interface HsmRequestContext__Output {
  'node_id': (Buffer);
  'dbid': (string);
  'capabilities': (string);
}
