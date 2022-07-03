// Original file: proto/lightning.proto


export interface ConfirmationUpdate {
  'block_sha'?: (Buffer | Uint8Array | string);
  'block_height'?: (number);
  'num_confs_left'?: (number);
}

export interface ConfirmationUpdate__Output {
  'block_sha': (Buffer);
  'block_height': (number);
  'num_confs_left': (number);
}
