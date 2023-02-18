// Original file: proto/greenlight.proto

export const NetAddressType = {
  Ipv4: 'Ipv4',
  Ipv6: 'Ipv6',
  TorV2: 'TorV2',
  TorV3: 'TorV3',
} as const

export type NetAddressType = 'Ipv4' | 0 | 'Ipv6' | 1 | 'TorV2' | 2 | 'TorV3' | 3

export type NetAddressType__Output =
  typeof NetAddressType[keyof typeof NetAddressType]
