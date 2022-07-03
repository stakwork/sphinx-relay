// Original file: proto/rpc_proxy.proto


export interface ListChannelsRequest {
  'active_only'?: (boolean);
  'inactive_only'?: (boolean);
  'public_only'?: (boolean);
  'private_only'?: (boolean);
  'peer'?: (Buffer | Uint8Array | string);
}

export interface ListChannelsRequest__Output {
  'active_only': (boolean);
  'inactive_only': (boolean);
  'public_only': (boolean);
  'private_only': (boolean);
  'peer': (Buffer);
}
