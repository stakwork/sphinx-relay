// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'
import type {
  SendpayRoute as _cln_SendpayRoute,
  SendpayRoute__Output as _cln_SendpayRoute__Output,
} from '../cln/SendpayRoute'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SendpayRequest {
  route?: _cln_SendpayRoute[]
  payment_hash?: Buffer | Uint8Array | string
  label?: string
  bolt11?: string
  payment_secret?: Buffer | Uint8Array | string
  partid?: number
  groupid?: number | string | Long
  amount_msat?: _cln_Amount | null
  localinvreqid?: Buffer | Uint8Array | string
  _label?: 'label'
  _amount_msat?: 'amount_msat'
  _bolt11?: 'bolt11'
  _payment_secret?: 'payment_secret'
  _partid?: 'partid'
  _localinvreqid?: 'localinvreqid'
  _groupid?: 'groupid'
}

export interface SendpayRequest__Output {
  route: _cln_SendpayRoute__Output[]
  payment_hash: Buffer
  label?: string
  bolt11?: string
  payment_secret?: Buffer
  partid?: number
  groupid?: string
  amount_msat?: _cln_Amount__Output | null
  localinvreqid?: Buffer
  _label: 'label'
  _amount_msat: 'amount_msat'
  _bolt11: 'bolt11'
  _payment_secret: 'payment_secret'
  _partid: 'partid'
  _localinvreqid: 'localinvreqid'
  _groupid: 'groupid'
}
