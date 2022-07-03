// Original file: proto/lightning.proto


export interface PsbtShim {
  'pending_chan_id'?: (Buffer | Uint8Array | string);
  'base_psbt'?: (Buffer | Uint8Array | string);
  'no_publish'?: (boolean);
}

export interface PsbtShim__Output {
  'pending_chan_id': (Buffer);
  'base_psbt': (Buffer);
  'no_publish': (boolean);
}
