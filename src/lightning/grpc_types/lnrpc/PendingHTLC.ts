// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface PendingHTLC {
  'incoming'?: (boolean);
  'amount'?: (number | string | Long);
  'outpoint'?: (string);
  'maturity_height'?: (number);
  'blocks_til_maturity'?: (number);
  'stage'?: (number);
}

export interface PendingHTLC__Output {
  'incoming': (boolean);
  'amount': (string);
  'outpoint': (string);
  'maturity_height': (number);
  'blocks_til_maturity': (number);
  'stage': (number);
}
