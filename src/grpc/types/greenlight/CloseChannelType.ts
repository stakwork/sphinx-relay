// Original file: proto/greenlight.proto

export const CloseChannelType = {
  MUTUAL: 'MUTUAL',
  UNILATERAL: 'UNILATERAL',
} as const

export type CloseChannelType = 'MUTUAL' | 0 | 'UNILATERAL' | 1

export type CloseChannelType__Output =
  typeof CloseChannelType[keyof typeof CloseChannelType]
