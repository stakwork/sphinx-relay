// Original file: proto/lightning.proto


export interface DeleteAllPaymentsRequest {
  'failed_payments_only'?: (boolean);
  'failed_htlcs_only'?: (boolean);
}

export interface DeleteAllPaymentsRequest__Output {
  'failed_payments_only': (boolean);
  'failed_htlcs_only': (boolean);
}
