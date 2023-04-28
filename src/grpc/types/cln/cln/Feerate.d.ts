// Original file: proto/cln/primitives.proto

export interface Feerate {
  slow?: boolean
  normal?: boolean
  urgent?: boolean
  perkb?: number
  perkw?: number
  style?: 'slow' | 'normal' | 'urgent' | 'perkb' | 'perkw'
}

export interface Feerate__Output {
  slow?: boolean
  normal?: boolean
  urgent?: boolean
  perkb?: number
  perkw?: number
  style: 'slow' | 'normal' | 'urgent' | 'perkb' | 'perkw'
}
