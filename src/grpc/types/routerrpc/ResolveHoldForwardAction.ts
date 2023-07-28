// Original file: proto/router.proto

export const ResolveHoldForwardAction = {
  SETTLE: 'SETTLE',
  FAIL: 'FAIL',
  RESUME: 'RESUME',
} as const

export type ResolveHoldForwardAction = 'SETTLE' | 0 | 'FAIL' | 1 | 'RESUME' | 2

export type ResolveHoldForwardAction__Output =
  (typeof ResolveHoldForwardAction)[keyof typeof ResolveHoldForwardAction]
