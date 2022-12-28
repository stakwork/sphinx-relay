// Original file: proto/lightning.proto

export interface ChannelPoint {
  funding_txid_bytes?: Buffer | Uint8Array | string
  funding_txid_str?: string
  output_index?: number
  funding_txid?: 'funding_txid_bytes' | 'funding_txid_str'
}

export interface ChannelPoint__Output {
  funding_txid_bytes?: Buffer
  funding_txid_str?: string
  output_index: number
  funding_txid: 'funding_txid_bytes' | 'funding_txid_str'
}
