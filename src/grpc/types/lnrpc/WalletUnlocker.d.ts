// Original file: proto/walletunlocker.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  ChangePasswordRequest as _lnrpc_ChangePasswordRequest,
  ChangePasswordRequest__Output as _lnrpc_ChangePasswordRequest__Output,
} from '../lnrpc/ChangePasswordRequest'
import type {
  ChangePasswordResponse as _lnrpc_ChangePasswordResponse,
  ChangePasswordResponse__Output as _lnrpc_ChangePasswordResponse__Output,
} from '../lnrpc/ChangePasswordResponse'
import type {
  GenSeedRequest as _lnrpc_GenSeedRequest,
  GenSeedRequest__Output as _lnrpc_GenSeedRequest__Output,
} from '../lnrpc/GenSeedRequest'
import type {
  GenSeedResponse as _lnrpc_GenSeedResponse,
  GenSeedResponse__Output as _lnrpc_GenSeedResponse__Output,
} from '../lnrpc/GenSeedResponse'
import type {
  InitWalletRequest as _lnrpc_InitWalletRequest,
  InitWalletRequest__Output as _lnrpc_InitWalletRequest__Output,
} from '../lnrpc/InitWalletRequest'
import type {
  InitWalletResponse as _lnrpc_InitWalletResponse,
  InitWalletResponse__Output as _lnrpc_InitWalletResponse__Output,
} from '../lnrpc/InitWalletResponse'
import type {
  UnlockWalletRequest as _lnrpc_UnlockWalletRequest,
  UnlockWalletRequest__Output as _lnrpc_UnlockWalletRequest__Output,
} from '../lnrpc/UnlockWalletRequest'
import type {
  UnlockWalletResponse as _lnrpc_UnlockWalletResponse,
  UnlockWalletResponse__Output as _lnrpc_UnlockWalletResponse__Output,
} from '../lnrpc/UnlockWalletResponse'

export interface WalletUnlockerClient extends grpc.Client {
  ChangePassword(
    argument: _lnrpc_ChangePasswordRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  ChangePassword(
    argument: _lnrpc_ChangePasswordRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  ChangePassword(
    argument: _lnrpc_ChangePasswordRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  ChangePassword(
    argument: _lnrpc_ChangePasswordRequest,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  changePassword(
    argument: _lnrpc_ChangePasswordRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  changePassword(
    argument: _lnrpc_ChangePasswordRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  changePassword(
    argument: _lnrpc_ChangePasswordRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall
  changePassword(
    argument: _lnrpc_ChangePasswordRequest,
    callback: grpc.requestCallback<_lnrpc_ChangePasswordResponse__Output>
  ): grpc.ClientUnaryCall

  GenSeed(
    argument: _lnrpc_GenSeedRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  GenSeed(
    argument: _lnrpc_GenSeedRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  GenSeed(
    argument: _lnrpc_GenSeedRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  GenSeed(
    argument: _lnrpc_GenSeedRequest,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  genSeed(
    argument: _lnrpc_GenSeedRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  genSeed(
    argument: _lnrpc_GenSeedRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  genSeed(
    argument: _lnrpc_GenSeedRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall
  genSeed(
    argument: _lnrpc_GenSeedRequest,
    callback: grpc.requestCallback<_lnrpc_GenSeedResponse__Output>
  ): grpc.ClientUnaryCall

  InitWallet(
    argument: _lnrpc_InitWalletRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  InitWallet(
    argument: _lnrpc_InitWalletRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  InitWallet(
    argument: _lnrpc_InitWalletRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  InitWallet(
    argument: _lnrpc_InitWalletRequest,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  initWallet(
    argument: _lnrpc_InitWalletRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  initWallet(
    argument: _lnrpc_InitWalletRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  initWallet(
    argument: _lnrpc_InitWalletRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall
  initWallet(
    argument: _lnrpc_InitWalletRequest,
    callback: grpc.requestCallback<_lnrpc_InitWalletResponse__Output>
  ): grpc.ClientUnaryCall

  UnlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  UnlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  UnlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  UnlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  unlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  unlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  unlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
  unlockWallet(
    argument: _lnrpc_UnlockWalletRequest,
    callback: grpc.requestCallback<_lnrpc_UnlockWalletResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface WalletUnlockerHandlers
  extends grpc.UntypedServiceImplementation {
  ChangePassword: grpc.handleUnaryCall<
    _lnrpc_ChangePasswordRequest__Output,
    _lnrpc_ChangePasswordResponse
  >

  GenSeed: grpc.handleUnaryCall<
    _lnrpc_GenSeedRequest__Output,
    _lnrpc_GenSeedResponse
  >

  InitWallet: grpc.handleUnaryCall<
    _lnrpc_InitWalletRequest__Output,
    _lnrpc_InitWalletResponse
  >

  UnlockWallet: grpc.handleUnaryCall<
    _lnrpc_UnlockWalletRequest__Output,
    _lnrpc_UnlockWalletResponse
  >
}

export interface WalletUnlockerDefinition extends grpc.ServiceDefinition {
  ChangePassword: MethodDefinition<
    _lnrpc_ChangePasswordRequest,
    _lnrpc_ChangePasswordResponse,
    _lnrpc_ChangePasswordRequest__Output,
    _lnrpc_ChangePasswordResponse__Output
  >
  GenSeed: MethodDefinition<
    _lnrpc_GenSeedRequest,
    _lnrpc_GenSeedResponse,
    _lnrpc_GenSeedRequest__Output,
    _lnrpc_GenSeedResponse__Output
  >
  InitWallet: MethodDefinition<
    _lnrpc_InitWalletRequest,
    _lnrpc_InitWalletResponse,
    _lnrpc_InitWalletRequest__Output,
    _lnrpc_InitWalletResponse__Output
  >
  UnlockWallet: MethodDefinition<
    _lnrpc_UnlockWalletRequest,
    _lnrpc_UnlockWalletResponse,
    _lnrpc_UnlockWalletRequest__Output,
    _lnrpc_UnlockWalletResponse__Output
  >
}
