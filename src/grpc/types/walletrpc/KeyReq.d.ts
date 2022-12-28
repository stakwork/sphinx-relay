// Original file: proto/walletkit.proto

export interface KeyReq {
  key_finger_print?: number
  key_family?: number
}

export interface KeyReq__Output {
  key_finger_print: number
  key_family: number
}
