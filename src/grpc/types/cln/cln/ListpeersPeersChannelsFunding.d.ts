// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface ListpeersPeersChannelsFunding {
  pushed_msat?: _cln_Amount | null
  local_funds_msat?: _cln_Amount | null
  fee_paid_msat?: _cln_Amount | null
  fee_rcvd_msat?: _cln_Amount | null
  remote_funds_msat?: _cln_Amount | null
  _pushed_msat?: 'pushed_msat'
  _fee_paid_msat?: 'fee_paid_msat'
  _fee_rcvd_msat?: 'fee_rcvd_msat'
}

export interface ListpeersPeersChannelsFunding__Output {
  pushed_msat?: _cln_Amount__Output | null
  local_funds_msat: _cln_Amount__Output | null
  fee_paid_msat?: _cln_Amount__Output | null
  fee_rcvd_msat?: _cln_Amount__Output | null
  remote_funds_msat: _cln_Amount__Output | null
  _pushed_msat: 'pushed_msat'
  _fee_paid_msat: 'fee_paid_msat'
  _fee_rcvd_msat: 'fee_rcvd_msat'
}
