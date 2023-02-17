// Original file: proto/lightning.proto

export interface FundingShimCancel {
  pending_chan_id?: Buffer | Uint8Array | string
}

export interface FundingShimCancel__Output {
  pending_chan_id: Buffer
}
