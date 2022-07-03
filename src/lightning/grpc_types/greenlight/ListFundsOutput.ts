// Original file: proto/greenlight.proto

import type { Outpoint as _greenlight_Outpoint, Outpoint__Output as _greenlight_Outpoint__Output } from '../greenlight/Outpoint';
import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';
import type { OutputStatus as _greenlight_OutputStatus } from '../greenlight/OutputStatus';

export interface ListFundsOutput {
  'output'?: (_greenlight_Outpoint | null);
  'amount'?: (_greenlight_Amount | null);
  'address'?: (string);
  'status'?: (_greenlight_OutputStatus | keyof typeof _greenlight_OutputStatus);
}

export interface ListFundsOutput__Output {
  'output': (_greenlight_Outpoint__Output | null);
  'amount': (_greenlight_Amount__Output | null);
  'address': (string);
  'status': (keyof typeof _greenlight_OutputStatus);
}
