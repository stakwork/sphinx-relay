// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  OutputScriptType as _lnrpc_OutputScriptType,
  OutputScriptType__Output as _lnrpc_OutputScriptType__Output,
} from '../lnrpc/OutputScriptType'

export interface OutputDetail {
  output_type?: _lnrpc_OutputScriptType
  address?: string
  pk_script?: string
  output_index?: number | string | Long
  amount?: number | string | Long
  is_our_address?: boolean
}

export interface OutputDetail__Output {
  output_type: _lnrpc_OutputScriptType__Output
  address: string
  pk_script: string
  output_index: string
  amount: string
  is_our_address: boolean
}
