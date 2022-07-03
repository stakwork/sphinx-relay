// Original file: proto/scheduler.proto


export interface NodeInfoResponse {
  'node_id'?: (Buffer | Uint8Array | string);
  'grpc_uri'?: (string);
}

export interface NodeInfoResponse__Output {
  'node_id': (Buffer);
  'grpc_uri': (string);
}
