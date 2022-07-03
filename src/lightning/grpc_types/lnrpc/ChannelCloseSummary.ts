// Original file: proto/lightning.proto

import type { Initiator as _lnrpc_Initiator } from '../lnrpc/Initiator';
import type { Resolution as _lnrpc_Resolution, Resolution__Output as _lnrpc_Resolution__Output } from '../lnrpc/Resolution';
import type { Long } from '@grpc/proto-loader';

// Original file: proto/lightning.proto

export enum _lnrpc_ChannelCloseSummary_ClosureType {
  COOPERATIVE_CLOSE = 0,
  LOCAL_FORCE_CLOSE = 1,
  REMOTE_FORCE_CLOSE = 2,
  BREACH_CLOSE = 3,
  FUNDING_CANCELED = 4,
  ABANDONED = 5,
}

export interface ChannelCloseSummary {
  'channel_point'?: (string);
  'chan_id'?: (number | string | Long);
  'chain_hash'?: (string);
  'closing_tx_hash'?: (string);
  'remote_pubkey'?: (string);
  'capacity'?: (number | string | Long);
  'close_height'?: (number);
  'settled_balance'?: (number | string | Long);
  'time_locked_balance'?: (number | string | Long);
  'close_type'?: (_lnrpc_ChannelCloseSummary_ClosureType | keyof typeof _lnrpc_ChannelCloseSummary_ClosureType);
  'open_initiator'?: (_lnrpc_Initiator | keyof typeof _lnrpc_Initiator);
  'close_initiator'?: (_lnrpc_Initiator | keyof typeof _lnrpc_Initiator);
  'resolutions'?: (_lnrpc_Resolution)[];
}

export interface ChannelCloseSummary__Output {
  'channel_point': (string);
  'chan_id': (string);
  'chain_hash': (string);
  'closing_tx_hash': (string);
  'remote_pubkey': (string);
  'capacity': (string);
  'close_height': (number);
  'settled_balance': (string);
  'time_locked_balance': (string);
  'close_type': (keyof typeof _lnrpc_ChannelCloseSummary_ClosureType);
  'open_initiator': (keyof typeof _lnrpc_Initiator);
  'close_initiator': (keyof typeof _lnrpc_Initiator);
  'resolutions': (_lnrpc_Resolution__Output)[];
}
