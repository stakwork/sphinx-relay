// Original file: proto/lightning.proto

export interface SignMessageRequest {
  msg?: Buffer | Uint8Array | string
  single_hash?: boolean
}

export interface SignMessageRequest__Output {
  msg: Buffer
  single_hash: boolean
}
