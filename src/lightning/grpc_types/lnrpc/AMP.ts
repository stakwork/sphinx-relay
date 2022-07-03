// Original file: proto/lightning.proto


export interface AMP {
  'root_share'?: (Buffer | Uint8Array | string);
  'set_id'?: (Buffer | Uint8Array | string);
  'child_index'?: (number);
  'hash'?: (Buffer | Uint8Array | string);
  'preimage'?: (Buffer | Uint8Array | string);
}

export interface AMP__Output {
  'root_share': (Buffer);
  'set_id': (Buffer);
  'child_index': (number);
  'hash': (Buffer);
  'preimage': (Buffer);
}
