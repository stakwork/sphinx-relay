// Original file: proto/lightning.proto

export const NodeMetricType = {
  UNKNOWN: 'UNKNOWN',
  BETWEENNESS_CENTRALITY: 'BETWEENNESS_CENTRALITY',
} as const

export type NodeMetricType = 'UNKNOWN' | 0 | 'BETWEENNESS_CENTRALITY' | 1

export type NodeMetricType__Output =
  typeof NodeMetricType[keyof typeof NodeMetricType]
