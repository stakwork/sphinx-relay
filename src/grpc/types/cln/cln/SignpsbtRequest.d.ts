// Original file: proto/cln/node.proto

export interface SignpsbtRequest {
  psbt?: string
  signonly?: number[]
}

export interface SignpsbtRequest__Output {
  psbt: string
  signonly: number[]
}
