// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { Long } from '@grpc/proto-loader';

export interface PolicyUpdateRequest {
  'global'?: (boolean);
  'chan_point'?: (_lnrpc_ChannelPoint | null);
  'base_fee_msat'?: (number | string | Long);
  'fee_rate'?: (number | string);
  'time_lock_delta'?: (number);
  'max_htlc_msat'?: (number | string | Long);
  'min_htlc_msat'?: (number | string | Long);
  'min_htlc_msat_specified'?: (boolean);
  'fee_rate_ppm'?: (number);
  'scope'?: "global"|"chan_point";
}

export interface PolicyUpdateRequest__Output {
  'global'?: (boolean);
  'chan_point'?: (_lnrpc_ChannelPoint__Output | null);
  'base_fee_msat': (string);
  'fee_rate': (number);
  'time_lock_delta': (number);
  'max_htlc_msat': (string);
  'min_htlc_msat': (string);
  'min_htlc_msat_specified': (boolean);
  'fee_rate_ppm': (number);
  'scope': "global"|"chan_point";
}
