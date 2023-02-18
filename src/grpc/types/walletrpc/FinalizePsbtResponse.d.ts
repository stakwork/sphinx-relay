// Original file: proto/walletkit.proto

export interface FinalizePsbtResponse {
  signed_psbt?: Buffer | Uint8Array | string
  raw_final_tx?: Buffer | Uint8Array | string
}

export interface FinalizePsbtResponse__Output {
  signed_psbt: Buffer
  raw_final_tx: Buffer
}
