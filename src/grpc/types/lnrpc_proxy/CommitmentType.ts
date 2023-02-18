// Original file: proto/rpc_proxy.proto

export const CommitmentType = {
  LEGACY: 'LEGACY',
  STATIC_REMOTE_KEY: 'STATIC_REMOTE_KEY',
  ANCHORS: 'ANCHORS',
  UNKNOWN_COMMITMENT_TYPE: 'UNKNOWN_COMMITMENT_TYPE',
} as const

export type CommitmentType =
  | 'LEGACY'
  | 0
  | 'STATIC_REMOTE_KEY'
  | 1
  | 'ANCHORS'
  | 2
  | 'UNKNOWN_COMMITMENT_TYPE'
  | 999

export type CommitmentType__Output =
  typeof CommitmentType[keyof typeof CommitmentType]
