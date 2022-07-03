// Original file: proto/lightning.proto


export interface FundingPsbtFinalize {
  'signed_psbt'?: (Buffer | Uint8Array | string);
  'pending_chan_id'?: (Buffer | Uint8Array | string);
  'final_raw_tx'?: (Buffer | Uint8Array | string);
}

export interface FundingPsbtFinalize__Output {
  'signed_psbt': (Buffer);
  'pending_chan_id': (Buffer);
  'final_raw_tx': (Buffer);
}
