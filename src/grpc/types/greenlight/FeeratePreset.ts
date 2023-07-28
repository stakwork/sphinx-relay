// Original file: proto/greenlight.proto

export const FeeratePreset = {
  NORMAL: 'NORMAL',
  SLOW: 'SLOW',
  URGENT: 'URGENT',
} as const

export type FeeratePreset = 'NORMAL' | 0 | 'SLOW' | 1 | 'URGENT' | 2

export type FeeratePreset__Output =
  (typeof FeeratePreset)[keyof typeof FeeratePreset]
