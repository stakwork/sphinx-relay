// Original file: proto/cln/primitives.proto

export interface Outpoint {
  txid?: Buffer | Uint8Array | string
  outnum?: number
}

export interface Outpoint__Output {
  txid: Buffer
  outnum: number
}
