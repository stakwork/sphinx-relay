// Original file: proto/lightning.proto

import type { FundingShim as _lnrpc_FundingShim, FundingShim__Output as _lnrpc_FundingShim__Output } from '../lnrpc/FundingShim';
import type { CommitmentType as _lnrpc_CommitmentType } from '../lnrpc/CommitmentType';
import type { Long } from '@grpc/proto-loader';

export interface OpenChannelRequest {
  'sat_per_vbyte'?: (number | string | Long);
  'node_pubkey'?: (Buffer | Uint8Array | string);
  'node_pubkey_string'?: (string);
  'local_funding_amount'?: (number | string | Long);
  'push_sat'?: (number | string | Long);
  'target_conf'?: (number);
  'sat_per_byte'?: (number | string | Long);
  'private'?: (boolean);
  'min_htlc_msat'?: (number | string | Long);
  'remote_csv_delay'?: (number);
  'min_confs'?: (number);
  'spend_unconfirmed'?: (boolean);
  'close_address'?: (string);
  'funding_shim'?: (_lnrpc_FundingShim | null);
  'remote_max_value_in_flight_msat'?: (number | string | Long);
  'remote_max_htlcs'?: (number);
  'max_local_csv'?: (number);
  'commitment_type'?: (_lnrpc_CommitmentType | keyof typeof _lnrpc_CommitmentType);
}

export interface OpenChannelRequest__Output {
  'sat_per_vbyte': (string);
  'node_pubkey': (Buffer);
  'node_pubkey_string': (string);
  'local_funding_amount': (string);
  'push_sat': (string);
  'target_conf': (number);
  'sat_per_byte': (string);
  'private': (boolean);
  'min_htlc_msat': (string);
  'remote_csv_delay': (number);
  'min_confs': (number);
  'spend_unconfirmed': (boolean);
  'close_address': (string);
  'funding_shim': (_lnrpc_FundingShim__Output | null);
  'remote_max_value_in_flight_msat': (string);
  'remote_max_htlcs': (number);
  'max_local_csv': (number);
  'commitment_type': (keyof typeof _lnrpc_CommitmentType);
}
