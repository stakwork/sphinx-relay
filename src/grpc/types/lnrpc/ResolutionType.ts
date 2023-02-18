// Original file: proto/lightning.proto

export const ResolutionType = {
  TYPE_UNKNOWN: 'TYPE_UNKNOWN',
  ANCHOR: 'ANCHOR',
  INCOMING_HTLC: 'INCOMING_HTLC',
  OUTGOING_HTLC: 'OUTGOING_HTLC',
  COMMIT: 'COMMIT',
} as const

export type ResolutionType =
  | 'TYPE_UNKNOWN'
  | 0
  | 'ANCHOR'
  | 1
  | 'INCOMING_HTLC'
  | 2
  | 'OUTGOING_HTLC'
  | 3
  | 'COMMIT'
  | 4

export type ResolutionType__Output =
  typeof ResolutionType[keyof typeof ResolutionType]
