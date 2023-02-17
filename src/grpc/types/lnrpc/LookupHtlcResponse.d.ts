// Original file: proto/lightning.proto

export interface LookupHtlcResponse {
  settled?: boolean
  offchain?: boolean
}

export interface LookupHtlcResponse__Output {
  settled: boolean
  offchain: boolean
}
