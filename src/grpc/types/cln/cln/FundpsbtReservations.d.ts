// Original file: proto/cln/node.proto

export interface FundpsbtReservations {
  txid?: Buffer | Uint8Array | string
  vout?: number
  was_reserved?: boolean
  reserved?: boolean
  reserved_to_block?: number
}

export interface FundpsbtReservations__Output {
  txid: Buffer
  vout: number
  was_reserved: boolean
  reserved: boolean
  reserved_to_block: number
}
