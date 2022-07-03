// Original file: proto/signer.proto


export interface MuSig2SignResponse {
  'local_partial_signature'?: (Buffer | Uint8Array | string);
}

export interface MuSig2SignResponse__Output {
  'local_partial_signature': (Buffer);
}
