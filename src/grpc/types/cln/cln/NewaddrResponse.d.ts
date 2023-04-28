// Original file: proto/cln/node.proto

export interface NewaddrResponse {
  bech32?: string
  p2sh_segwit?: string
  _bech32?: 'bech32'
  _p2sh_segwit?: 'p2sh_segwit'
}

export interface NewaddrResponse__Output {
  bech32?: string
  p2sh_segwit?: string
  _bech32: 'bech32'
  _p2sh_segwit: 'p2sh_segwit'
}
