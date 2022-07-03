// Original file: proto/lightning.proto

export enum ResolutionOutcome {
  OUTCOME_UNKNOWN = 0,
  CLAIMED = 1,
  UNCLAIMED = 2,
  ABANDONED = 3,
  FIRST_STAGE = 4,
  TIMEOUT = 5,
}
