import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  cln: {
    Amount: MessageTypeDefinition
    AmountOrAll: MessageTypeDefinition
    AmountOrAny: MessageTypeDefinition
    ChannelSide: EnumTypeDefinition
    ChannelState: EnumTypeDefinition
    ChannelStateChangeCause: MessageTypeDefinition
    Feerate: MessageTypeDefinition
    Outpoint: MessageTypeDefinition
    OutputDesc: MessageTypeDefinition
    RouteHop: MessageTypeDefinition
    Routehint: MessageTypeDefinition
    RoutehintList: MessageTypeDefinition
    TlvEntry: MessageTypeDefinition
    TlvStream: MessageTypeDefinition
  }
}
