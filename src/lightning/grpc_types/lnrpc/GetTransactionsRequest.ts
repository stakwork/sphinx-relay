// Original file: proto/lightning.proto


export interface GetTransactionsRequest {
  'start_height'?: (number);
  'end_height'?: (number);
  'account'?: (string);
}

export interface GetTransactionsRequest__Output {
  'start_height': (number);
  'end_height': (number);
  'account': (string);
}
