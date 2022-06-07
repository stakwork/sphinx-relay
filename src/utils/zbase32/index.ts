import './tv42_zbase32_gopherjs'

export function encode(bytes: Uint8Array): string {
  return global['zbase32'].Encode(bytes)
}

export function decode(txt: string): Uint8Array {
  return global['zbase32'].Decode(txt)
}
