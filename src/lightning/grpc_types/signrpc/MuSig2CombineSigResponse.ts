// Original file: proto/signer.proto


export interface MuSig2CombineSigResponse {
  'have_all_signatures'?: (boolean);
  'final_signature'?: (Buffer | Uint8Array | string);
}

export interface MuSig2CombineSigResponse__Output {
  'have_all_signatures': (boolean);
  'final_signature': (Buffer);
}
