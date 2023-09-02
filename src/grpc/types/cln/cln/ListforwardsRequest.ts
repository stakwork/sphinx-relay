// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListforwardsRequest_ListforwardsStatus = {
  OFFERED: 'OFFERED',
  SETTLED: 'SETTLED',
  LOCAL_FAILED: 'LOCAL_FAILED',
  FAILED: 'FAILED',
} as const

export type _cln_ListforwardsRequest_ListforwardsStatus =
  | 'OFFERED'
  | 0
  | 'SETTLED'
  | 1
  | 'LOCAL_FAILED'
  | 2
  | 'FAILED'
  | 3

export type _cln_ListforwardsRequest_ListforwardsStatus__Output =
  (typeof _cln_ListforwardsRequest_ListforwardsStatus)[keyof typeof _cln_ListforwardsRequest_ListforwardsStatus]

export interface ListforwardsRequest {
  status?: _cln_ListforwardsRequest_ListforwardsStatus
  in_channel?: string
  out_channel?: string
  _status?: 'status'
  _in_channel?: 'in_channel'
  _out_channel?: 'out_channel'
}

export interface ListforwardsRequest__Output {
  status?: _cln_ListforwardsRequest_ListforwardsStatus__Output
  in_channel?: string
  out_channel?: string
  _status: 'status'
  _in_channel: 'in_channel'
  _out_channel: 'out_channel'
}
