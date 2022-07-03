// Original file: proto/signer.proto


export interface MuSig2RegisterNoncesRequest {
  'session_id'?: (Buffer | Uint8Array | string);
  'other_signer_public_nonces'?: (Buffer | Uint8Array | string)[];
}

export interface MuSig2RegisterNoncesRequest__Output {
  'session_id': (Buffer);
  'other_signer_public_nonces': (Buffer)[];
}
