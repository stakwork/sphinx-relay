// Original file: proto/scheduler.proto

import type {
  ChallengeScope as _scheduler_ChallengeScope,
  ChallengeScope__Output as _scheduler_ChallengeScope__Output,
} from '../scheduler/ChallengeScope'

export interface ChallengeRequest {
  scope?: _scheduler_ChallengeScope
  node_id?: Buffer | Uint8Array | string
}

export interface ChallengeRequest__Output {
  scope: _scheduler_ChallengeScope__Output
  node_id: Buffer
}
