// Original file: proto/greenlight.proto

import type { Address as _greenlight_Address, Address__Output as _greenlight_Address__Output } from '../greenlight/Address';

export interface GetInfoResponse {
  'node_id'?: (Buffer | Uint8Array | string);
  'alias'?: (string);
  'color'?: (Buffer | Uint8Array | string);
  'num_peers'?: (number);
  'addresses'?: (_greenlight_Address)[];
  'version'?: (string);
  'blockheight'?: (number);
  'network'?: (string);
}

export interface GetInfoResponse__Output {
  'node_id': (Buffer);
  'alias': (string);
  'color': (Buffer);
  'num_peers': (number);
  'addresses': (_greenlight_Address__Output)[];
  'version': (string);
  'blockheight': (number);
  'network': (string);
}
