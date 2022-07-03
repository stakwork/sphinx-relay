// Original file: proto/lightning.proto

export enum CommitmentType {
  UNKNOWN_COMMITMENT_TYPE = 0,
  LEGACY = 1,
  STATIC_REMOTE_KEY = 2,
  ANCHORS = 3,
  SCRIPT_ENFORCED_LEASE = 4,
}
