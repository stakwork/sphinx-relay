// Original file: proto/cln/node.proto

export interface FundchannelResponse {
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
  outnum?: number
  channel_id?: Buffer | Uint8Array | string
  close_to?: Buffer | Uint8Array | string
  mindepth?: number
  _close_to?: 'close_to'
  _mindepth?: 'mindepth'
}

export interface FundchannelResponse__Output {
  tx: Buffer
  txid: Buffer
  outnum: number
  channel_id: Buffer
  close_to?: Buffer
  mindepth?: number
  _close_to: 'close_to'
  _mindepth: 'mindepth'
}
