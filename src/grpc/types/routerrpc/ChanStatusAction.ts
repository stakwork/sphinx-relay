// Original file: proto/router.proto

export const ChanStatusAction = {
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE',
  AUTO: 'AUTO',
} as const

export type ChanStatusAction = 'ENABLE' | 0 | 'DISABLE' | 1 | 'AUTO' | 2

export type ChanStatusAction__Output =
  (typeof ChanStatusAction)[keyof typeof ChanStatusAction]
