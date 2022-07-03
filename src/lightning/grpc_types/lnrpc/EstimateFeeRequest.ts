// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface EstimateFeeRequest {
  'AddrToAmount'?: ({[key: string]: number | string | Long});
  'target_conf'?: (number);
  'min_confs'?: (number);
  'spend_unconfirmed'?: (boolean);
}

export interface EstimateFeeRequest__Output {
  'AddrToAmount': ({[key: string]: string});
  'target_conf': (number);
  'min_confs': (number);
  'spend_unconfirmed': (boolean);
}
