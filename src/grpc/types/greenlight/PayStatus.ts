// Original file: proto/greenlight.proto

export const PayStatus = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
} as const

export type PayStatus = 'PENDING' | 0 | 'COMPLETE' | 1 | 'FAILED' | 2

export type PayStatus__Output = (typeof PayStatus)[keyof typeof PayStatus]
