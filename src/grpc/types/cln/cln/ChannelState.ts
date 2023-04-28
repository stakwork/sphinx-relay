// Original file: proto/cln/primitives.proto

export const ChannelState = {
  Openingd: 'Openingd',
  ChanneldAwaitingLockin: 'ChanneldAwaitingLockin',
  ChanneldNormal: 'ChanneldNormal',
  ChanneldShuttingDown: 'ChanneldShuttingDown',
  ClosingdSigexchange: 'ClosingdSigexchange',
  ClosingdComplete: 'ClosingdComplete',
  AwaitingUnilateral: 'AwaitingUnilateral',
  FundingSpendSeen: 'FundingSpendSeen',
  Onchain: 'Onchain',
  DualopendOpenInit: 'DualopendOpenInit',
  DualopendAwaitingLockin: 'DualopendAwaitingLockin',
} as const

export type ChannelState =
  | 'Openingd'
  | 0
  | 'ChanneldAwaitingLockin'
  | 1
  | 'ChanneldNormal'
  | 2
  | 'ChanneldShuttingDown'
  | 3
  | 'ClosingdSigexchange'
  | 4
  | 'ClosingdComplete'
  | 5
  | 'AwaitingUnilateral'
  | 6
  | 'FundingSpendSeen'
  | 7
  | 'Onchain'
  | 8
  | 'DualopendOpenInit'
  | 9
  | 'DualopendAwaitingLockin'
  | 10

export type ChannelState__Output =
  typeof ChannelState[keyof typeof ChannelState]
