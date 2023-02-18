// Original file: proto/scheduler.proto

export const ChallengeScope = {
  REGISTER: 'REGISTER',
  RECOVER: 'RECOVER',
} as const

export type ChallengeScope = 'REGISTER' | 0 | 'RECOVER' | 1

export type ChallengeScope__Output =
  typeof ChallengeScope[keyof typeof ChallengeScope]
