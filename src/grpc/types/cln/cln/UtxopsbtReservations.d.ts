// Original file: proto/cln/node.proto

export interface UtxopsbtReservations {
  txid?: Buffer | Uint8Array | string
  vout?: number
  was_reserved?: boolean
  reserved?: boolean
  reserved_to_block?: number
}

export interface UtxopsbtReservations__Output {
  txid: Buffer
  vout: number
  was_reserved: boolean
  reserved: boolean
  reserved_to_block: number
}
