// Original file: proto/signer.proto


export interface InputScript {
  'witness'?: (Buffer | Uint8Array | string)[];
  'sig_script'?: (Buffer | Uint8Array | string);
}

export interface InputScript__Output {
  'witness': (Buffer)[];
  'sig_script': (Buffer);
}
