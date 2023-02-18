// Original file: proto/lightning.proto

import type {
  PendingUpdate as _lnrpc_PendingUpdate,
  PendingUpdate__Output as _lnrpc_PendingUpdate__Output,
} from '../lnrpc/PendingUpdate'
import type {
  ChannelOpenUpdate as _lnrpc_ChannelOpenUpdate,
  ChannelOpenUpdate__Output as _lnrpc_ChannelOpenUpdate__Output,
} from '../lnrpc/ChannelOpenUpdate'
import type {
  ReadyForPsbtFunding as _lnrpc_ReadyForPsbtFunding,
  ReadyForPsbtFunding__Output as _lnrpc_ReadyForPsbtFunding__Output,
} from '../lnrpc/ReadyForPsbtFunding'

export interface OpenStatusUpdate {
  chan_pending?: _lnrpc_PendingUpdate | null
  chan_open?: _lnrpc_ChannelOpenUpdate | null
  pending_chan_id?: Buffer | Uint8Array | string
  psbt_fund?: _lnrpc_ReadyForPsbtFunding | null
  update?: 'chan_pending' | 'chan_open' | 'psbt_fund'
}

export interface OpenStatusUpdate__Output {
  chan_pending?: _lnrpc_PendingUpdate__Output | null
  chan_open?: _lnrpc_ChannelOpenUpdate__Output | null
  pending_chan_id: Buffer
  psbt_fund?: _lnrpc_ReadyForPsbtFunding__Output | null
  update: 'chan_pending' | 'chan_open' | 'psbt_fund'
}
