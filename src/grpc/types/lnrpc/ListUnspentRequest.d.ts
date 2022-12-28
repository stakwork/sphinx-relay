// Original file: proto/lightning.proto

export interface ListUnspentRequest {
  min_confs?: number
  max_confs?: number
  account?: string
}

export interface ListUnspentRequest__Output {
  min_confs: number
  max_confs: number
  account: string
}
