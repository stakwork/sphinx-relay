// Original file: proto/walletkit.proto

import type { Long } from '@grpc/proto-loader'
import type {
  OutPoint as _lnrpc_OutPoint,
  OutPoint__Output as _lnrpc_OutPoint__Output,
} from '../lnrpc/OutPoint'
import type {
  WitnessType as _walletrpc_WitnessType,
  WitnessType__Output as _walletrpc_WitnessType__Output,
} from '../walletrpc/WitnessType'

export interface PendingSweep {
  outpoint?: _lnrpc_OutPoint | null
  witness_type?: _walletrpc_WitnessType
  amount_sat?: number
  sat_per_byte?: number
  broadcast_attempts?: number
  next_broadcast_height?: number
  force?: boolean
  requested_conf_target?: number
  requested_sat_per_byte?: number
  sat_per_vbyte?: number | string | Long
  requested_sat_per_vbyte?: number | string | Long
}

export interface PendingSweep__Output {
  outpoint: _lnrpc_OutPoint__Output | null
  witness_type: _walletrpc_WitnessType__Output
  amount_sat: number
  sat_per_byte: number
  broadcast_attempts: number
  next_broadcast_height: number
  force: boolean
  requested_conf_target: number
  requested_sat_per_byte: number
  sat_per_vbyte: string
  requested_sat_per_vbyte: string
}
