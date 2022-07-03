// Original file: proto/router.proto

import type { MissionControlConfig as _routerrpc_MissionControlConfig, MissionControlConfig__Output as _routerrpc_MissionControlConfig__Output } from '../routerrpc/MissionControlConfig';

export interface SetMissionControlConfigRequest {
  'config'?: (_routerrpc_MissionControlConfig | null);
}

export interface SetMissionControlConfigRequest__Output {
  'config': (_routerrpc_MissionControlConfig__Output | null);
}
