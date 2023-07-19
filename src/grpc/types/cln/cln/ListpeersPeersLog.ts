// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListpeersPeersLog_ListpeersPeersLogType = {
  SKIPPED: 'SKIPPED',
  BROKEN: 'BROKEN',
  UNUSUAL: 'UNUSUAL',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  IO_IN: 'IO_IN',
  IO_OUT: 'IO_OUT',
} as const

export type _cln_ListpeersPeersLog_ListpeersPeersLogType =
  | 'SKIPPED'
  | 0
  | 'BROKEN'
  | 1
  | 'UNUSUAL'
  | 2
  | 'INFO'
  | 3
  | 'DEBUG'
  | 4
  | 'IO_IN'
  | 5
  | 'IO_OUT'
  | 6

export type _cln_ListpeersPeersLog_ListpeersPeersLogType__Output =
  (typeof _cln_ListpeersPeersLog_ListpeersPeersLogType)[keyof typeof _cln_ListpeersPeersLog_ListpeersPeersLogType]

export interface ListpeersPeersLog {
  item_type?: _cln_ListpeersPeersLog_ListpeersPeersLogType
  num_skipped?: number
  time?: string
  source?: string
  log?: string
  node_id?: Buffer | Uint8Array | string
  data?: Buffer | Uint8Array | string
  _num_skipped?: 'num_skipped'
  _time?: 'time'
  _source?: 'source'
  _log?: 'log'
  _node_id?: 'node_id'
  _data?: 'data'
}

export interface ListpeersPeersLog__Output {
  item_type: _cln_ListpeersPeersLog_ListpeersPeersLogType__Output
  num_skipped?: number
  time?: string
  source?: string
  log?: string
  node_id?: Buffer
  data?: Buffer
  _num_skipped: 'num_skipped'
  _time: 'time'
  _source: 'source'
  _log: 'log'
  _node_id: 'node_id'
  _data: 'data'
}
