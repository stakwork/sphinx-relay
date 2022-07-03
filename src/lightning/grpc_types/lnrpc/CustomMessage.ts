// Original file: proto/lightning.proto


export interface CustomMessage {
  'peer'?: (Buffer | Uint8Array | string);
  'type'?: (number);
  'data'?: (Buffer | Uint8Array | string);
}

export interface CustomMessage__Output {
  'peer': (Buffer);
  'type': (number);
  'data': (Buffer);
}
