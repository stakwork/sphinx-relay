// Original file: proto/lightning.proto

export interface ChannelCloseUpdate {
  closing_txid?: Buffer | Uint8Array | string
  success?: boolean
}

export interface ChannelCloseUpdate__Output {
  closing_txid: Buffer
  success: boolean
}
