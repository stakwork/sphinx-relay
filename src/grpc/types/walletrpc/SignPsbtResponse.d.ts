// Original file: proto/walletkit.proto

export interface SignPsbtResponse {
  signed_psbt?: Buffer | Uint8Array | string
  signed_inputs?: number[]
}

export interface SignPsbtResponse__Output {
  signed_psbt: Buffer
  signed_inputs: number[]
}
