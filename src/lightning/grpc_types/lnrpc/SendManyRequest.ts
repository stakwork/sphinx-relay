// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface SendManyRequest {
  'AddrToAmount'?: ({[key: string]: number | string | Long});
  'target_conf'?: (number);
  'sat_per_vbyte'?: (number | string | Long);
  'sat_per_byte'?: (number | string | Long);
  'label'?: (string);
  'min_confs'?: (number);
  'spend_unconfirmed'?: (boolean);
}

export interface SendManyRequest__Output {
  'AddrToAmount': ({[key: string]: string});
  'target_conf': (number);
  'sat_per_vbyte': (string);
  'sat_per_byte': (string);
  'label': (string);
  'min_confs': (number);
  'spend_unconfirmed': (boolean);
}
