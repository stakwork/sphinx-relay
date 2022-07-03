// Original file: proto/scheduler.proto


export interface RecoveryRequest {
  'challenge'?: (Buffer | Uint8Array | string);
  'signature'?: (Buffer | Uint8Array | string);
  'node_id'?: (Buffer | Uint8Array | string);
}

export interface RecoveryRequest__Output {
  'challenge': (Buffer);
  'signature': (Buffer);
  'node_id': (Buffer);
}
