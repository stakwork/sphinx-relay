// Original file: proto/signer.proto

export interface MuSig2SessionResponse {
  session_id?: Buffer | Uint8Array | string
  combined_key?: Buffer | Uint8Array | string
  taproot_internal_key?: Buffer | Uint8Array | string
  local_public_nonces?: Buffer | Uint8Array | string
  have_all_nonces?: boolean
}

export interface MuSig2SessionResponse__Output {
  session_id: Buffer
  combined_key: Buffer
  taproot_internal_key: Buffer
  local_public_nonces: Buffer
  have_all_nonces: boolean
}
