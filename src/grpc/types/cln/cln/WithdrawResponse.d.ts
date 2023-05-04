// Original file: proto/cln/node.proto

export interface WithdrawResponse {
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
  psbt?: string
}

export interface WithdrawResponse__Output {
  tx: Buffer
  txid: Buffer
  psbt: string
}
