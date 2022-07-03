// Original file: proto/lightning.proto


export interface GetRecoveryInfoResponse {
  'recovery_mode'?: (boolean);
  'recovery_finished'?: (boolean);
  'progress'?: (number | string);
}

export interface GetRecoveryInfoResponse__Output {
  'recovery_mode': (boolean);
  'recovery_finished': (boolean);
  'progress': (number);
}
