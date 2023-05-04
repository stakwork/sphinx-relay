// Original file: proto/cln/node.proto

export interface ListchannelsRequest {
  short_channel_id?: string
  source?: Buffer | Uint8Array | string
  destination?: Buffer | Uint8Array | string
  _short_channel_id?: 'short_channel_id'
  _source?: 'source'
  _destination?: 'destination'
}

export interface ListchannelsRequest__Output {
  short_channel_id?: string
  source?: Buffer
  destination?: Buffer
  _short_channel_id: 'short_channel_id'
  _source: 'source'
  _destination: 'destination'
}
