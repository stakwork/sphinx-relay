// Original file: proto/lightning.proto

import type {
  NodeAddress as _lnrpc_NodeAddress,
  NodeAddress__Output as _lnrpc_NodeAddress__Output,
} from '../lnrpc/NodeAddress'
import type {
  Feature as _lnrpc_Feature,
  Feature__Output as _lnrpc_Feature__Output,
} from '../lnrpc/Feature'

export interface LightningNode {
  last_update?: number
  pub_key?: string
  alias?: string
  addresses?: _lnrpc_NodeAddress[]
  color?: string
  features?: { [key: number]: _lnrpc_Feature }
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
}

export interface LightningNode__Output {
  last_update: number
  pub_key: string
  alias: string
  addresses: _lnrpc_NodeAddress__Output[]
  color: string
  features: { [key: number]: _lnrpc_Feature__Output }
  custom_records: { [key: number]: Buffer }
}
