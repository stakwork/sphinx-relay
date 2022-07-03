// Original file: proto/scheduler.proto

import type * as grpc from 'grpc'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ChallengeRequest as _scheduler_ChallengeRequest, ChallengeRequest__Output as _scheduler_ChallengeRequest__Output } from '../scheduler/ChallengeRequest';
import type { ChallengeResponse as _scheduler_ChallengeResponse, ChallengeResponse__Output as _scheduler_ChallengeResponse__Output } from '../scheduler/ChallengeResponse';
import type { NodeInfoRequest as _scheduler_NodeInfoRequest, NodeInfoRequest__Output as _scheduler_NodeInfoRequest__Output } from '../scheduler/NodeInfoRequest';
import type { NodeInfoResponse as _scheduler_NodeInfoResponse, NodeInfoResponse__Output as _scheduler_NodeInfoResponse__Output } from '../scheduler/NodeInfoResponse';
import type { RecoveryRequest as _scheduler_RecoveryRequest, RecoveryRequest__Output as _scheduler_RecoveryRequest__Output } from '../scheduler/RecoveryRequest';
import type { RecoveryResponse as _scheduler_RecoveryResponse, RecoveryResponse__Output as _scheduler_RecoveryResponse__Output } from '../scheduler/RecoveryResponse';
import type { RegistrationRequest as _scheduler_RegistrationRequest, RegistrationRequest__Output as _scheduler_RegistrationRequest__Output } from '../scheduler/RegistrationRequest';
import type { RegistrationResponse as _scheduler_RegistrationResponse, RegistrationResponse__Output as _scheduler_RegistrationResponse__Output } from '../scheduler/RegistrationResponse';
import type { ScheduleRequest as _scheduler_ScheduleRequest, ScheduleRequest__Output as _scheduler_ScheduleRequest__Output } from '../scheduler/ScheduleRequest';

export interface SchedulerClient extends grpc.Client {
  GetChallenge(argument: _scheduler_ChallengeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  GetChallenge(argument: _scheduler_ChallengeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  GetChallenge(argument: _scheduler_ChallengeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  GetChallenge(argument: _scheduler_ChallengeRequest, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  getChallenge(argument: _scheduler_ChallengeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  getChallenge(argument: _scheduler_ChallengeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  getChallenge(argument: _scheduler_ChallengeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  getChallenge(argument: _scheduler_ChallengeRequest, callback: grpc.requestCallback<_scheduler_ChallengeResponse__Output>): grpc.ClientUnaryCall;
  
  GetNodeInfo(argument: _scheduler_NodeInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  GetNodeInfo(argument: _scheduler_NodeInfoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  GetNodeInfo(argument: _scheduler_NodeInfoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  GetNodeInfo(argument: _scheduler_NodeInfoRequest, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  getNodeInfo(argument: _scheduler_NodeInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  getNodeInfo(argument: _scheduler_NodeInfoRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  getNodeInfo(argument: _scheduler_NodeInfoRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  getNodeInfo(argument: _scheduler_NodeInfoRequest, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  
  Recover(argument: _scheduler_RecoveryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  Recover(argument: _scheduler_RecoveryRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  Recover(argument: _scheduler_RecoveryRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  Recover(argument: _scheduler_RecoveryRequest, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  recover(argument: _scheduler_RecoveryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  recover(argument: _scheduler_RecoveryRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  recover(argument: _scheduler_RecoveryRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  recover(argument: _scheduler_RecoveryRequest, callback: grpc.requestCallback<_scheduler_RecoveryResponse__Output>): grpc.ClientUnaryCall;
  
  Register(argument: _scheduler_RegistrationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  Register(argument: _scheduler_RegistrationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  Register(argument: _scheduler_RegistrationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  Register(argument: _scheduler_RegistrationRequest, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  register(argument: _scheduler_RegistrationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  register(argument: _scheduler_RegistrationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  register(argument: _scheduler_RegistrationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  register(argument: _scheduler_RegistrationRequest, callback: grpc.requestCallback<_scheduler_RegistrationResponse__Output>): grpc.ClientUnaryCall;
  
  Schedule(argument: _scheduler_ScheduleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  Schedule(argument: _scheduler_ScheduleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  Schedule(argument: _scheduler_ScheduleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  Schedule(argument: _scheduler_ScheduleRequest, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  schedule(argument: _scheduler_ScheduleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  schedule(argument: _scheduler_ScheduleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  schedule(argument: _scheduler_ScheduleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  schedule(argument: _scheduler_ScheduleRequest, callback: grpc.requestCallback<_scheduler_NodeInfoResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface SchedulerHandlers extends grpc.UntypedServiceImplementation {
  GetChallenge: grpc.handleUnaryCall<_scheduler_ChallengeRequest__Output, _scheduler_ChallengeResponse>;
  
  GetNodeInfo: grpc.handleUnaryCall<_scheduler_NodeInfoRequest__Output, _scheduler_NodeInfoResponse>;
  
  Recover: grpc.handleUnaryCall<_scheduler_RecoveryRequest__Output, _scheduler_RecoveryResponse>;
  
  Register: grpc.handleUnaryCall<_scheduler_RegistrationRequest__Output, _scheduler_RegistrationResponse>;
  
  Schedule: grpc.handleUnaryCall<_scheduler_ScheduleRequest__Output, _scheduler_NodeInfoResponse>;
  
}

export interface SchedulerDefinition extends grpc.ServiceDefinition {
  GetChallenge: MethodDefinition<_scheduler_ChallengeRequest, _scheduler_ChallengeResponse, _scheduler_ChallengeRequest__Output, _scheduler_ChallengeResponse__Output>
  GetNodeInfo: MethodDefinition<_scheduler_NodeInfoRequest, _scheduler_NodeInfoResponse, _scheduler_NodeInfoRequest__Output, _scheduler_NodeInfoResponse__Output>
  Recover: MethodDefinition<_scheduler_RecoveryRequest, _scheduler_RecoveryResponse, _scheduler_RecoveryRequest__Output, _scheduler_RecoveryResponse__Output>
  Register: MethodDefinition<_scheduler_RegistrationRequest, _scheduler_RegistrationResponse, _scheduler_RegistrationRequest__Output, _scheduler_RegistrationResponse__Output>
  Schedule: MethodDefinition<_scheduler_ScheduleRequest, _scheduler_NodeInfoResponse, _scheduler_ScheduleRequest__Output, _scheduler_NodeInfoResponse__Output>
}
