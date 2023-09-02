// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_GetrouteRoute_GetrouteRouteStyle = {
  TLV: 'TLV',
} as const

export type _cln_GetrouteRoute_GetrouteRouteStyle = 'TLV' | 0

export type _cln_GetrouteRoute_GetrouteRouteStyle__Output =
  (typeof _cln_GetrouteRoute_GetrouteRouteStyle)[keyof typeof _cln_GetrouteRoute_GetrouteRouteStyle]

export interface GetrouteRoute {
  id?: Buffer | Uint8Array | string
  channel?: string
  direction?: number
  amount_msat?: _cln_Amount | null
  delay?: number
  style?: _cln_GetrouteRoute_GetrouteRouteStyle
}

export interface GetrouteRoute__Output {
  id: Buffer
  channel: string
  direction: number
  amount_msat: _cln_Amount__Output | null
  delay: number
  style: _cln_GetrouteRoute_GetrouteRouteStyle__Output
}
