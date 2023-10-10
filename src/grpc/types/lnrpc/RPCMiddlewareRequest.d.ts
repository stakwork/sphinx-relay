// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  StreamAuth as _lnrpc_StreamAuth,
  StreamAuth__Output as _lnrpc_StreamAuth__Output,
} from '../lnrpc/StreamAuth'
import type {
  RPCMessage as _lnrpc_RPCMessage,
  RPCMessage__Output as _lnrpc_RPCMessage__Output,
} from '../lnrpc/RPCMessage'

export interface RPCMiddlewareRequest {
  request_id?: number | string | Long
  raw_macaroon?: Buffer | Uint8Array | string
  custom_caveat_condition?: string
  stream_auth?: _lnrpc_StreamAuth | null
  request?: _lnrpc_RPCMessage | null
  response?: _lnrpc_RPCMessage | null
  msg_id?: number | string | Long
  reg_complete?: boolean
  intercept_type?: 'stream_auth' | 'request' | 'response' | 'reg_complete'
}

export interface RPCMiddlewareRequest__Output {
  request_id: string
  raw_macaroon: Buffer
  custom_caveat_condition: string
  stream_auth?: _lnrpc_StreamAuth__Output | null
  request?: _lnrpc_RPCMessage__Output | null
  response?: _lnrpc_RPCMessage__Output | null
  msg_id: string
  reg_complete?: boolean
  intercept_type: 'stream_auth' | 'request' | 'response' | 'reg_complete'
}
