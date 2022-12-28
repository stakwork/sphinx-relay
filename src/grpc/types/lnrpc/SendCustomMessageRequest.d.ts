// Original file: proto/lightning.proto

export interface SendCustomMessageRequest {
  peer?: Buffer | Uint8Array | string
  type?: number
  data?: Buffer | Uint8Array | string
}

export interface SendCustomMessageRequest__Output {
  peer: Buffer
  type: number
  data: Buffer
}
