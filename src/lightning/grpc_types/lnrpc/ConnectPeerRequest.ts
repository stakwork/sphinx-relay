// Original file: proto/lightning.proto

import type { LightningAddress as _lnrpc_LightningAddress, LightningAddress__Output as _lnrpc_LightningAddress__Output } from '../lnrpc/LightningAddress';
import type { Long } from '@grpc/proto-loader';

export interface ConnectPeerRequest {
  'addr'?: (_lnrpc_LightningAddress | null);
  'perm'?: (boolean);
  'timeout'?: (number | string | Long);
}

export interface ConnectPeerRequest__Output {
  'addr': (_lnrpc_LightningAddress__Output | null);
  'perm': (boolean);
  'timeout': (string);
}
