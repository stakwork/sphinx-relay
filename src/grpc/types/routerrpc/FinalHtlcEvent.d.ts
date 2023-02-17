// Original file: proto/router.proto

export interface FinalHtlcEvent {
  settled?: boolean
  offchain?: boolean
}

export interface FinalHtlcEvent__Output {
  settled: boolean
  offchain: boolean
}
