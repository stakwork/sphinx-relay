// Original file: proto/lightning.proto

import type { Feature as _lnrpc_Feature, Feature__Output as _lnrpc_Feature__Output } from '../lnrpc/Feature';
import type { NodeAddress as _lnrpc_NodeAddress, NodeAddress__Output as _lnrpc_NodeAddress__Output } from '../lnrpc/NodeAddress';

export interface NodeUpdate {
  'addresses'?: (string)[];
  'identity_key'?: (string);
  'global_features'?: (Buffer | Uint8Array | string);
  'alias'?: (string);
  'color'?: (string);
  'features'?: ({[key: number]: _lnrpc_Feature});
  'node_addresses'?: (_lnrpc_NodeAddress)[];
}

export interface NodeUpdate__Output {
  'addresses': (string)[];
  'identity_key': (string);
  'global_features': (Buffer);
  'alias': (string);
  'color': (string);
  'features': ({[key: number]: _lnrpc_Feature__Output});
  'node_addresses': (_lnrpc_NodeAddress__Output)[];
}
