import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  HsmClient as _greenlight_HsmClient,
  HsmDefinition as _greenlight_HsmDefinition,
} from './greenlight/Hsm'
import type {
  NodeClient as _greenlight_NodeClient,
  NodeDefinition as _greenlight_NodeDefinition,
} from './greenlight/Node'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  greenlight: {
    Address: MessageTypeDefinition
    Amount: MessageTypeDefinition
    BitcoinAddress: MessageTypeDefinition
    BtcAddressType: EnumTypeDefinition
    Channel: MessageTypeDefinition
    CloseChannelRequest: MessageTypeDefinition
    CloseChannelResponse: MessageTypeDefinition
    CloseChannelType: EnumTypeDefinition
    Confirmation: MessageTypeDefinition
    ConnectRequest: MessageTypeDefinition
    ConnectResponse: MessageTypeDefinition
    DisconnectRequest: MessageTypeDefinition
    DisconnectResponse: MessageTypeDefinition
    Empty: MessageTypeDefinition
    Feerate: MessageTypeDefinition
    FeeratePreset: EnumTypeDefinition
    FundChannelRequest: MessageTypeDefinition
    FundChannelResponse: MessageTypeDefinition
    GetInfoRequest: MessageTypeDefinition
    GetInfoResponse: MessageTypeDefinition
    Hsm: SubtypeConstructor<typeof grpc.Client, _greenlight_HsmClient> & {
      service: _greenlight_HsmDefinition
    }
    HsmRequest: MessageTypeDefinition
    HsmRequestContext: MessageTypeDefinition
    HsmResponse: MessageTypeDefinition
    Htlc: MessageTypeDefinition
    IncomingPayment: MessageTypeDefinition
    Invoice: MessageTypeDefinition
    InvoiceIdentifier: MessageTypeDefinition
    InvoiceRequest: MessageTypeDefinition
    InvoiceStatus: EnumTypeDefinition
    KeysendRequest: MessageTypeDefinition
    ListFundsChannel: MessageTypeDefinition
    ListFundsOutput: MessageTypeDefinition
    ListFundsRequest: MessageTypeDefinition
    ListFundsResponse: MessageTypeDefinition
    ListInvoicesRequest: MessageTypeDefinition
    ListInvoicesResponse: MessageTypeDefinition
    ListPaymentsRequest: MessageTypeDefinition
    ListPaymentsResponse: MessageTypeDefinition
    ListPeersRequest: MessageTypeDefinition
    ListPeersResponse: MessageTypeDefinition
    NetAddressType: EnumTypeDefinition
    NewAddrRequest: MessageTypeDefinition
    NewAddrResponse: MessageTypeDefinition
    Node: SubtypeConstructor<typeof grpc.Client, _greenlight_NodeClient> & {
      service: _greenlight_NodeDefinition
    }
    OffChainPayment: MessageTypeDefinition
    Outpoint: MessageTypeDefinition
    OutputStatus: EnumTypeDefinition
    PayRequest: MessageTypeDefinition
    PayStatus: EnumTypeDefinition
    Payment: MessageTypeDefinition
    PaymentIdentifier: MessageTypeDefinition
    Peer: MessageTypeDefinition
    Routehint: MessageTypeDefinition
    RoutehintHop: MessageTypeDefinition
    StopRequest: MessageTypeDefinition
    StopResponse: MessageTypeDefinition
    StreamIncomingFilter: MessageTypeDefinition
    Timeout: MessageTypeDefinition
    TlvField: MessageTypeDefinition
    WithdrawRequest: MessageTypeDefinition
    WithdrawResponse: MessageTypeDefinition
  }
}
