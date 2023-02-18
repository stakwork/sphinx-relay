// Original file: proto/lightning.proto

export const CommitmentType = {
  UNKNOWN_COMMITMENT_TYPE: 'UNKNOWN_COMMITMENT_TYPE',
  LEGACY: 'LEGACY',
  STATIC_REMOTE_KEY: 'STATIC_REMOTE_KEY',
  ANCHORS: 'ANCHORS',
  SCRIPT_ENFORCED_LEASE: 'SCRIPT_ENFORCED_LEASE',
} as const

export type CommitmentType =
  | 'UNKNOWN_COMMITMENT_TYPE'
  | 0
  | 'LEGACY'
  | 1
  | 'STATIC_REMOTE_KEY'
  | 2
  | 'ANCHORS'
  | 3
  | 'SCRIPT_ENFORCED_LEASE'
  | 4

export type CommitmentType__Output =
  typeof CommitmentType[keyof typeof CommitmentType]
