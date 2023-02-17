// Original file: proto/walletkit.proto

export interface FinalizePsbtRequest {
  funded_psbt?: Buffer | Uint8Array | string
  account?: string
}

export interface FinalizePsbtRequest__Output {
  funded_psbt: Buffer
  account: string
}
