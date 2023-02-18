// Original file: proto/greenlight.proto

export const OutputStatus = {
  CONFIRMED: 'CONFIRMED',
  UNCONFIRMED: 'UNCONFIRMED',
} as const

export type OutputStatus = 'CONFIRMED' | 0 | 'UNCONFIRMED' | 1

export type OutputStatus__Output =
  typeof OutputStatus[keyof typeof OutputStatus]
