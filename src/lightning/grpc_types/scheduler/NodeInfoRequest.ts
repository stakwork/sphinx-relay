// Original file: proto/scheduler.proto


export interface NodeInfoRequest {
  'node_id'?: (Buffer | Uint8Array | string);
  'wait'?: (boolean);
}

export interface NodeInfoRequest__Output {
  'node_id': (Buffer);
  'wait': (boolean);
}
