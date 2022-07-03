// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface SendCoinsRequest {
  'addr'?: (string);
  'amount'?: (number | string | Long);
  'target_conf'?: (number);
  'sat_per_vbyte'?: (number | string | Long);
  'sat_per_byte'?: (number | string | Long);
  'send_all'?: (boolean);
  'label'?: (string);
  'min_confs'?: (number);
  'spend_unconfirmed'?: (boolean);
}

export interface SendCoinsRequest__Output {
  'addr': (string);
  'amount': (string);
  'target_conf': (number);
  'sat_per_vbyte': (string);
  'sat_per_byte': (string);
  'send_all': (boolean);
  'label': (string);
  'min_confs': (number);
  'spend_unconfirmed': (boolean);
}
