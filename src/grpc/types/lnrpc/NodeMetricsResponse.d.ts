// Original file: proto/lightning.proto

import type {
  FloatMetric as _lnrpc_FloatMetric,
  FloatMetric__Output as _lnrpc_FloatMetric__Output,
} from '../lnrpc/FloatMetric'

export interface NodeMetricsResponse {
  betweenness_centrality?: { [key: string]: _lnrpc_FloatMetric }
}

export interface NodeMetricsResponse__Output {
  betweenness_centrality: { [key: string]: _lnrpc_FloatMetric__Output }
}
