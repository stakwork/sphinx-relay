// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader';

export interface MissionControlConfig {
  'half_life_seconds'?: (number | string | Long);
  'hop_probability'?: (number | string);
  'weight'?: (number | string);
  'maximum_payment_results'?: (number);
  'minimum_failure_relax_interval'?: (number | string | Long);
}

export interface MissionControlConfig__Output {
  'half_life_seconds': (string);
  'hop_probability': (number);
  'weight': (number);
  'maximum_payment_results': (number);
  'minimum_failure_relax_interval': (string);
}
