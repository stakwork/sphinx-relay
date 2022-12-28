// Original file: proto/walletkit.proto

export interface ListUnspentRequest {
  min_confs?: number
  max_confs?: number
  account?: string
  unconfirmed_only?: boolean
}

export interface ListUnspentRequest__Output {
  min_confs: number
  max_confs: number
  account: string
  unconfirmed_only: boolean
}
