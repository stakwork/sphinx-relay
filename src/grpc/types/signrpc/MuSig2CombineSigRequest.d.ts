// Original file: proto/signer.proto

export interface MuSig2CombineSigRequest {
  session_id?: Buffer | Uint8Array | string
  other_partial_signatures?: (Buffer | Uint8Array | string)[]
}

export interface MuSig2CombineSigRequest__Output {
  session_id: Buffer
  other_partial_signatures: Buffer[]
}
