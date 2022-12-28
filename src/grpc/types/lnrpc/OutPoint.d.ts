// Original file: proto/lightning.proto

export interface OutPoint {
  txid_bytes?: Buffer | Uint8Array | string
  txid_str?: string
  output_index?: number
}

export interface OutPoint__Output {
  txid_bytes: Buffer
  txid_str: string
  output_index: number
}
