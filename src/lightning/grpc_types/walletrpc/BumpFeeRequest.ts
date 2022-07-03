// Original file: proto/walletkit.proto

import type { OutPoint as _lnrpc_OutPoint, OutPoint__Output as _lnrpc_OutPoint__Output } from '../lnrpc/OutPoint';
import type { Long } from '@grpc/proto-loader';

export interface BumpFeeRequest {
  'outpoint'?: (_lnrpc_OutPoint | null);
  'target_conf'?: (number);
  'sat_per_byte'?: (number);
  'force'?: (boolean);
  'sat_per_vbyte'?: (number | string | Long);
}

export interface BumpFeeRequest__Output {
  'outpoint': (_lnrpc_OutPoint__Output | null);
  'target_conf': (number);
  'sat_per_byte': (number);
  'force': (boolean);
  'sat_per_vbyte': (string);
}
