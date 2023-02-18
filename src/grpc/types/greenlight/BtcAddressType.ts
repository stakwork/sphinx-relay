// Original file: proto/greenlight.proto

export const BtcAddressType = {
  BECH32: 'BECH32',
  P2SH_SEGWIT: 'P2SH_SEGWIT',
} as const

export type BtcAddressType = 'BECH32' | 0 | 'P2SH_SEGWIT' | 1

export type BtcAddressType__Output =
  typeof BtcAddressType[keyof typeof BtcAddressType]
