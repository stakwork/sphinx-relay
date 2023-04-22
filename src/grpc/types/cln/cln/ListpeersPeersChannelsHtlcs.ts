// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection =
  {
    IN: 'IN',
    OUT: 'OUT',
  } as const

export type _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection =
  'IN' | 0 | 'OUT' | 1

export type _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection__Output =
  typeof _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection[keyof typeof _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection]

export interface ListpeersPeersChannelsHtlcs {
  direction?: _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection
  id?: number | string | Long
  amount_msat?: _cln_Amount | null
  expiry?: number
  payment_hash?: Buffer | Uint8Array | string
  local_trimmed?: boolean
  status?: string
  _local_trimmed?: 'local_trimmed'
  _status?: 'status'
}

export interface ListpeersPeersChannelsHtlcs__Output {
  direction: _cln_ListpeersPeersChannelsHtlcs_ListpeersPeersChannelsHtlcsDirection__Output
  id: string
  amount_msat: _cln_Amount__Output | null
  expiry: number
  payment_hash: Buffer
  local_trimmed?: boolean
  status?: string
  _local_trimmed: 'local_trimmed'
  _status: 'status'
}
