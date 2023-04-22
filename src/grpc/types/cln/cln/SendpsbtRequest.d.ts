// Original file: proto/cln/node.proto

export interface SendpsbtRequest {
  psbt?: string
  reserve?: boolean
  _reserve?: 'reserve'
}

export interface SendpsbtRequest__Output {
  psbt: string
  reserve?: boolean
  _reserve: 'reserve'
}
