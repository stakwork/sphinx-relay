// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'
import type {
  SendonionFirst_hop as _cln_SendonionFirst_hop,
  SendonionFirst_hop__Output as _cln_SendonionFirst_hop__Output,
} from '../cln/SendonionFirst_hop'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SendonionRequest {
  onion?: Buffer | Uint8Array | string
  first_hop?: _cln_SendonionFirst_hop | null
  payment_hash?: Buffer | Uint8Array | string
  label?: string
  shared_secrets?: (Buffer | Uint8Array | string)[]
  partid?: number
  bolt11?: string
  destination?: Buffer | Uint8Array | string
  groupid?: number | string | Long
  amount_msat?: _cln_Amount | null
  localinvreqid?: Buffer | Uint8Array | string
  _label?: 'label'
  _partid?: 'partid'
  _bolt11?: 'bolt11'
  _amount_msat?: 'amount_msat'
  _destination?: 'destination'
  _localinvreqid?: 'localinvreqid'
  _groupid?: 'groupid'
}

export interface SendonionRequest__Output {
  onion: Buffer
  first_hop: _cln_SendonionFirst_hop__Output | null
  payment_hash: Buffer
  label?: string
  shared_secrets: Buffer[]
  partid?: number
  bolt11?: string
  destination?: Buffer
  groupid?: string
  amount_msat?: _cln_Amount__Output | null
  localinvreqid?: Buffer
  _label: 'label'
  _partid: 'partid'
  _bolt11: 'bolt11'
  _amount_msat: 'amount_msat'
  _destination: 'destination'
  _localinvreqid: 'localinvreqid'
  _groupid: 'groupid'
}
