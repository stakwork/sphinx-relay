// Original file: proto/cln/node.proto

import type {
  ListfundsOutputs as _cln_ListfundsOutputs,
  ListfundsOutputs__Output as _cln_ListfundsOutputs__Output,
} from '../cln/ListfundsOutputs'
import type {
  ListfundsChannels as _cln_ListfundsChannels,
  ListfundsChannels__Output as _cln_ListfundsChannels__Output,
} from '../cln/ListfundsChannels'

export interface ListfundsResponse {
  outputs?: _cln_ListfundsOutputs[]
  channels?: _cln_ListfundsChannels[]
}

export interface ListfundsResponse__Output {
  outputs: _cln_ListfundsOutputs__Output[]
  channels: _cln_ListfundsChannels__Output[]
}
