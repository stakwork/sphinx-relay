// Original file: proto/cln/primitives.proto

export const ChannelSide = {
  IN: 'IN',
  OUT: 'OUT',
} as const

export type ChannelSide = 'IN' | 0 | 'OUT' | 1

export type ChannelSide__Output = typeof ChannelSide[keyof typeof ChannelSide]
