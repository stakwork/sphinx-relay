// Original file: proto/lightning.proto


export interface AMPRecord {
  'root_share'?: (Buffer | Uint8Array | string);
  'set_id'?: (Buffer | Uint8Array | string);
  'child_index'?: (number);
}

export interface AMPRecord__Output {
  'root_share': (Buffer);
  'set_id': (Buffer);
  'child_index': (number);
}
