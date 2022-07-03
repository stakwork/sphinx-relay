// Original file: proto/scheduler.proto

import type { ChallengeScope as _scheduler_ChallengeScope } from '../scheduler/ChallengeScope';

export interface ChallengeRequest {
  'scope'?: (_scheduler_ChallengeScope | keyof typeof _scheduler_ChallengeScope);
  'node_id'?: (Buffer | Uint8Array | string);
}

export interface ChallengeRequest__Output {
  'scope': (keyof typeof _scheduler_ChallengeScope);
  'node_id': (Buffer);
}
