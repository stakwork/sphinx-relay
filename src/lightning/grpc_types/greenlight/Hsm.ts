// Original file: proto/greenlight.proto

import type * as grpc from 'grpc'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { Empty as _greenlight_Empty, Empty__Output as _greenlight_Empty__Output } from '../greenlight/Empty';
import type { HsmRequest as _greenlight_HsmRequest, HsmRequest__Output as _greenlight_HsmRequest__Output } from '../greenlight/HsmRequest';
import type { HsmResponse as _greenlight_HsmResponse, HsmResponse__Output as _greenlight_HsmResponse__Output } from '../greenlight/HsmResponse';

export interface HsmClient extends grpc.Client {
  Ping(argument: _greenlight_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  Ping(argument: _greenlight_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  Ping(argument: _greenlight_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  Ping(argument: _greenlight_Empty, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  ping(argument: _greenlight_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  ping(argument: _greenlight_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  ping(argument: _greenlight_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  ping(argument: _greenlight_Empty, callback: grpc.requestCallback<_greenlight_Empty__Output>): grpc.ClientUnaryCall;
  
  Request(argument: _greenlight_HsmRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  Request(argument: _greenlight_HsmRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  Request(argument: _greenlight_HsmRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  Request(argument: _greenlight_HsmRequest, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  request(argument: _greenlight_HsmRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  request(argument: _greenlight_HsmRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  request(argument: _greenlight_HsmRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  request(argument: _greenlight_HsmRequest, callback: grpc.requestCallback<_greenlight_HsmResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface HsmHandlers extends grpc.UntypedServiceImplementation {
  Ping: grpc.handleUnaryCall<_greenlight_Empty__Output, _greenlight_Empty>;
  
  Request: grpc.handleUnaryCall<_greenlight_HsmRequest__Output, _greenlight_HsmResponse>;
  
}

export interface HsmDefinition extends grpc.ServiceDefinition {
  Ping: MethodDefinition<_greenlight_Empty, _greenlight_Empty, _greenlight_Empty__Output, _greenlight_Empty__Output>
  Request: MethodDefinition<_greenlight_HsmRequest, _greenlight_HsmResponse, _greenlight_HsmRequest__Output, _greenlight_HsmResponse__Output>
}
