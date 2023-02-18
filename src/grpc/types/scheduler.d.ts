import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  SchedulerClient as _scheduler_SchedulerClient,
  SchedulerDefinition as _scheduler_SchedulerDefinition,
} from './scheduler/Scheduler'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  scheduler: {
    ChallengeRequest: MessageTypeDefinition
    ChallengeResponse: MessageTypeDefinition
    ChallengeScope: EnumTypeDefinition
    NodeInfoRequest: MessageTypeDefinition
    NodeInfoResponse: MessageTypeDefinition
    RecoveryRequest: MessageTypeDefinition
    RecoveryResponse: MessageTypeDefinition
    RegistrationRequest: MessageTypeDefinition
    RegistrationResponse: MessageTypeDefinition
    ScheduleRequest: MessageTypeDefinition
    Scheduler: SubtypeConstructor<
      typeof grpc.Client,
      _scheduler_SchedulerClient
    > & { service: _scheduler_SchedulerDefinition }
  }
}
