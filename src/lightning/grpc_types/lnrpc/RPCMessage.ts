// Original file: proto/lightning.proto


export interface RPCMessage {
  'method_full_uri'?: (string);
  'stream_rpc'?: (boolean);
  'type_name'?: (string);
  'serialized'?: (Buffer | Uint8Array | string);
}

export interface RPCMessage__Output {
  'method_full_uri': (string);
  'stream_rpc': (boolean);
  'type_name': (string);
  'serialized': (Buffer);
}
