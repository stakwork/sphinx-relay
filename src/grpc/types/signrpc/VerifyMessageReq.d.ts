// Original file: proto/signer.proto

export interface VerifyMessageReq {
  msg?: Buffer | Uint8Array | string
  signature?: Buffer | Uint8Array | string
  pubkey?: Buffer | Uint8Array | string
  is_schnorr_sig?: boolean
}

export interface VerifyMessageReq__Output {
  msg: Buffer
  signature: Buffer
  pubkey: Buffer
  is_schnorr_sig: boolean
}
