// Original file: proto/lightning.proto

export interface FundingPsbtVerify {
  funded_psbt?: Buffer | Uint8Array | string
  pending_chan_id?: Buffer | Uint8Array | string
  skip_finalize?: boolean
}

export interface FundingPsbtVerify__Output {
  funded_psbt: Buffer
  pending_chan_id: Buffer
  skip_finalize: boolean
}
