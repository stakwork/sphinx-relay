// Original file: proto/signer.proto

export interface MuSig2CombineKeysResponse {
  combined_key?: Buffer | Uint8Array | string
  taproot_internal_key?: Buffer | Uint8Array | string
}

export interface MuSig2CombineKeysResponse__Output {
  combined_key: Buffer
  taproot_internal_key: Buffer
}
