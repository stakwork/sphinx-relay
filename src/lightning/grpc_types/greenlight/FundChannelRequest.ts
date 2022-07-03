// Original file: proto/greenlight.proto

import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';
import type { Feerate as _greenlight_Feerate, Feerate__Output as _greenlight_Feerate__Output } from '../greenlight/Feerate';
import type { Confirmation as _greenlight_Confirmation, Confirmation__Output as _greenlight_Confirmation__Output } from '../greenlight/Confirmation';

export interface FundChannelRequest {
  'node_id'?: (Buffer | Uint8Array | string);
  'amount'?: (_greenlight_Amount | null);
  'feerate'?: (_greenlight_Feerate | null);
  'announce'?: (boolean);
  'minconf'?: (_greenlight_Confirmation | null);
  'close_to'?: (string);
}

export interface FundChannelRequest__Output {
  'node_id': (Buffer);
  'amount': (_greenlight_Amount__Output | null);
  'feerate': (_greenlight_Feerate__Output | null);
  'announce': (boolean);
  'minconf': (_greenlight_Confirmation__Output | null);
  'close_to': (string);
}
