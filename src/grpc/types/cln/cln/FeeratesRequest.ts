// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_FeeratesRequest_FeeratesStyle = {
  PERKB: 'PERKB',
  PERKW: 'PERKW',
} as const

export type _cln_FeeratesRequest_FeeratesStyle = 'PERKB' | 0 | 'PERKW' | 1

export type _cln_FeeratesRequest_FeeratesStyle__Output =
  (typeof _cln_FeeratesRequest_FeeratesStyle)[keyof typeof _cln_FeeratesRequest_FeeratesStyle]

export interface FeeratesRequest {
  style?: _cln_FeeratesRequest_FeeratesStyle
}

export interface FeeratesRequest__Output {
  style: _cln_FeeratesRequest_FeeratesStyle__Output
}
