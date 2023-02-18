// Original file: proto/lightning.proto

export interface NodePair {
  from?: Buffer | Uint8Array | string
  to?: Buffer | Uint8Array | string
}

export interface NodePair__Output {
  from: Buffer
  to: Buffer
}
