// Original file: proto/signer.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  InputScriptResp as _signrpc_InputScriptResp,
  InputScriptResp__Output as _signrpc_InputScriptResp__Output,
} from '../signrpc/InputScriptResp'
import type {
  MuSig2CleanupRequest as _signrpc_MuSig2CleanupRequest,
  MuSig2CleanupRequest__Output as _signrpc_MuSig2CleanupRequest__Output,
} from '../signrpc/MuSig2CleanupRequest'
import type {
  MuSig2CleanupResponse as _signrpc_MuSig2CleanupResponse,
  MuSig2CleanupResponse__Output as _signrpc_MuSig2CleanupResponse__Output,
} from '../signrpc/MuSig2CleanupResponse'
import type {
  MuSig2CombineKeysRequest as _signrpc_MuSig2CombineKeysRequest,
  MuSig2CombineKeysRequest__Output as _signrpc_MuSig2CombineKeysRequest__Output,
} from '../signrpc/MuSig2CombineKeysRequest'
import type {
  MuSig2CombineKeysResponse as _signrpc_MuSig2CombineKeysResponse,
  MuSig2CombineKeysResponse__Output as _signrpc_MuSig2CombineKeysResponse__Output,
} from '../signrpc/MuSig2CombineKeysResponse'
import type {
  MuSig2CombineSigRequest as _signrpc_MuSig2CombineSigRequest,
  MuSig2CombineSigRequest__Output as _signrpc_MuSig2CombineSigRequest__Output,
} from '../signrpc/MuSig2CombineSigRequest'
import type {
  MuSig2CombineSigResponse as _signrpc_MuSig2CombineSigResponse,
  MuSig2CombineSigResponse__Output as _signrpc_MuSig2CombineSigResponse__Output,
} from '../signrpc/MuSig2CombineSigResponse'
import type {
  MuSig2RegisterNoncesRequest as _signrpc_MuSig2RegisterNoncesRequest,
  MuSig2RegisterNoncesRequest__Output as _signrpc_MuSig2RegisterNoncesRequest__Output,
} from '../signrpc/MuSig2RegisterNoncesRequest'
import type {
  MuSig2RegisterNoncesResponse as _signrpc_MuSig2RegisterNoncesResponse,
  MuSig2RegisterNoncesResponse__Output as _signrpc_MuSig2RegisterNoncesResponse__Output,
} from '../signrpc/MuSig2RegisterNoncesResponse'
import type {
  MuSig2SessionRequest as _signrpc_MuSig2SessionRequest,
  MuSig2SessionRequest__Output as _signrpc_MuSig2SessionRequest__Output,
} from '../signrpc/MuSig2SessionRequest'
import type {
  MuSig2SessionResponse as _signrpc_MuSig2SessionResponse,
  MuSig2SessionResponse__Output as _signrpc_MuSig2SessionResponse__Output,
} from '../signrpc/MuSig2SessionResponse'
import type {
  MuSig2SignRequest as _signrpc_MuSig2SignRequest,
  MuSig2SignRequest__Output as _signrpc_MuSig2SignRequest__Output,
} from '../signrpc/MuSig2SignRequest'
import type {
  MuSig2SignResponse as _signrpc_MuSig2SignResponse,
  MuSig2SignResponse__Output as _signrpc_MuSig2SignResponse__Output,
} from '../signrpc/MuSig2SignResponse'
import type {
  SharedKeyRequest as _signrpc_SharedKeyRequest,
  SharedKeyRequest__Output as _signrpc_SharedKeyRequest__Output,
} from '../signrpc/SharedKeyRequest'
import type {
  SharedKeyResponse as _signrpc_SharedKeyResponse,
  SharedKeyResponse__Output as _signrpc_SharedKeyResponse__Output,
} from '../signrpc/SharedKeyResponse'
import type {
  SignMessageReq as _signrpc_SignMessageReq,
  SignMessageReq__Output as _signrpc_SignMessageReq__Output,
} from '../signrpc/SignMessageReq'
import type {
  SignMessageResp as _signrpc_SignMessageResp,
  SignMessageResp__Output as _signrpc_SignMessageResp__Output,
} from '../signrpc/SignMessageResp'
import type {
  SignReq as _signrpc_SignReq,
  SignReq__Output as _signrpc_SignReq__Output,
} from '../signrpc/SignReq'
import type {
  SignResp as _signrpc_SignResp,
  SignResp__Output as _signrpc_SignResp__Output,
} from '../signrpc/SignResp'
import type {
  VerifyMessageReq as _signrpc_VerifyMessageReq,
  VerifyMessageReq__Output as _signrpc_VerifyMessageReq__Output,
} from '../signrpc/VerifyMessageReq'
import type {
  VerifyMessageResp as _signrpc_VerifyMessageResp,
  VerifyMessageResp__Output as _signrpc_VerifyMessageResp__Output,
} from '../signrpc/VerifyMessageResp'

export interface SignerClient extends grpc.Client {
  ComputeInputScript(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  ComputeInputScript(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  ComputeInputScript(
    argument: _signrpc_SignReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  ComputeInputScript(
    argument: _signrpc_SignReq,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  computeInputScript(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  computeInputScript(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  computeInputScript(
    argument: _signrpc_SignReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall
  computeInputScript(
    argument: _signrpc_SignReq,
    callback: grpc.requestCallback<_signrpc_InputScriptResp__Output>
  ): grpc.ClientUnaryCall

  DeriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  DeriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  DeriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  DeriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  deriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  deriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  deriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall
  deriveSharedKey(
    argument: _signrpc_SharedKeyRequest,
    callback: grpc.requestCallback<_signrpc_SharedKeyResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Cleanup(
    argument: _signrpc_MuSig2CleanupRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CleanupResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineKeys(
    argument: _signrpc_MuSig2CombineKeysRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineKeysResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CombineSig(
    argument: _signrpc_MuSig2CombineSigRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2CombineSigResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2CreateSession(
    argument: _signrpc_MuSig2SessionRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2SessionResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2RegisterNonces(
    argument: _signrpc_MuSig2RegisterNoncesRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2RegisterNoncesResponse__Output>
  ): grpc.ClientUnaryCall

  MuSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  MuSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall
  muSig2Sign(
    argument: _signrpc_MuSig2SignRequest,
    callback: grpc.requestCallback<_signrpc_MuSig2SignResponse__Output>
  ): grpc.ClientUnaryCall

  SignMessage(
    argument: _signrpc_SignMessageReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _signrpc_SignMessageReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _signrpc_SignMessageReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _signrpc_SignMessageReq,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _signrpc_SignMessageReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _signrpc_SignMessageReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _signrpc_SignMessageReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _signrpc_SignMessageReq,
    callback: grpc.requestCallback<_signrpc_SignMessageResp__Output>
  ): grpc.ClientUnaryCall

  SignOutputRaw(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  SignOutputRaw(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  SignOutputRaw(
    argument: _signrpc_SignReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  SignOutputRaw(
    argument: _signrpc_SignReq,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  signOutputRaw(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  signOutputRaw(
    argument: _signrpc_SignReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  signOutputRaw(
    argument: _signrpc_SignReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall
  signOutputRaw(
    argument: _signrpc_SignReq,
    callback: grpc.requestCallback<_signrpc_SignResp__Output>
  ): grpc.ClientUnaryCall

  VerifyMessage(
    argument: _signrpc_VerifyMessageReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _signrpc_VerifyMessageReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _signrpc_VerifyMessageReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _signrpc_VerifyMessageReq,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _signrpc_VerifyMessageReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _signrpc_VerifyMessageReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _signrpc_VerifyMessageReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _signrpc_VerifyMessageReq,
    callback: grpc.requestCallback<_signrpc_VerifyMessageResp__Output>
  ): grpc.ClientUnaryCall
}

export interface SignerHandlers extends grpc.UntypedServiceImplementation {
  ComputeInputScript: grpc.handleUnaryCall<
    _signrpc_SignReq__Output,
    _signrpc_InputScriptResp
  >

  DeriveSharedKey: grpc.handleUnaryCall<
    _signrpc_SharedKeyRequest__Output,
    _signrpc_SharedKeyResponse
  >

  MuSig2Cleanup: grpc.handleUnaryCall<
    _signrpc_MuSig2CleanupRequest__Output,
    _signrpc_MuSig2CleanupResponse
  >

  MuSig2CombineKeys: grpc.handleUnaryCall<
    _signrpc_MuSig2CombineKeysRequest__Output,
    _signrpc_MuSig2CombineKeysResponse
  >

  MuSig2CombineSig: grpc.handleUnaryCall<
    _signrpc_MuSig2CombineSigRequest__Output,
    _signrpc_MuSig2CombineSigResponse
  >

  MuSig2CreateSession: grpc.handleUnaryCall<
    _signrpc_MuSig2SessionRequest__Output,
    _signrpc_MuSig2SessionResponse
  >

  MuSig2RegisterNonces: grpc.handleUnaryCall<
    _signrpc_MuSig2RegisterNoncesRequest__Output,
    _signrpc_MuSig2RegisterNoncesResponse
  >

  MuSig2Sign: grpc.handleUnaryCall<
    _signrpc_MuSig2SignRequest__Output,
    _signrpc_MuSig2SignResponse
  >

  SignMessage: grpc.handleUnaryCall<
    _signrpc_SignMessageReq__Output,
    _signrpc_SignMessageResp
  >

  SignOutputRaw: grpc.handleUnaryCall<
    _signrpc_SignReq__Output,
    _signrpc_SignResp
  >

  VerifyMessage: grpc.handleUnaryCall<
    _signrpc_VerifyMessageReq__Output,
    _signrpc_VerifyMessageResp
  >
}

export interface SignerDefinition extends grpc.ServiceDefinition {
  ComputeInputScript: MethodDefinition<
    _signrpc_SignReq,
    _signrpc_InputScriptResp,
    _signrpc_SignReq__Output,
    _signrpc_InputScriptResp__Output
  >
  DeriveSharedKey: MethodDefinition<
    _signrpc_SharedKeyRequest,
    _signrpc_SharedKeyResponse,
    _signrpc_SharedKeyRequest__Output,
    _signrpc_SharedKeyResponse__Output
  >
  MuSig2Cleanup: MethodDefinition<
    _signrpc_MuSig2CleanupRequest,
    _signrpc_MuSig2CleanupResponse,
    _signrpc_MuSig2CleanupRequest__Output,
    _signrpc_MuSig2CleanupResponse__Output
  >
  MuSig2CombineKeys: MethodDefinition<
    _signrpc_MuSig2CombineKeysRequest,
    _signrpc_MuSig2CombineKeysResponse,
    _signrpc_MuSig2CombineKeysRequest__Output,
    _signrpc_MuSig2CombineKeysResponse__Output
  >
  MuSig2CombineSig: MethodDefinition<
    _signrpc_MuSig2CombineSigRequest,
    _signrpc_MuSig2CombineSigResponse,
    _signrpc_MuSig2CombineSigRequest__Output,
    _signrpc_MuSig2CombineSigResponse__Output
  >
  MuSig2CreateSession: MethodDefinition<
    _signrpc_MuSig2SessionRequest,
    _signrpc_MuSig2SessionResponse,
    _signrpc_MuSig2SessionRequest__Output,
    _signrpc_MuSig2SessionResponse__Output
  >
  MuSig2RegisterNonces: MethodDefinition<
    _signrpc_MuSig2RegisterNoncesRequest,
    _signrpc_MuSig2RegisterNoncesResponse,
    _signrpc_MuSig2RegisterNoncesRequest__Output,
    _signrpc_MuSig2RegisterNoncesResponse__Output
  >
  MuSig2Sign: MethodDefinition<
    _signrpc_MuSig2SignRequest,
    _signrpc_MuSig2SignResponse,
    _signrpc_MuSig2SignRequest__Output,
    _signrpc_MuSig2SignResponse__Output
  >
  SignMessage: MethodDefinition<
    _signrpc_SignMessageReq,
    _signrpc_SignMessageResp,
    _signrpc_SignMessageReq__Output,
    _signrpc_SignMessageResp__Output
  >
  SignOutputRaw: MethodDefinition<
    _signrpc_SignReq,
    _signrpc_SignResp,
    _signrpc_SignReq__Output,
    _signrpc_SignResp__Output
  >
  VerifyMessage: MethodDefinition<
    _signrpc_VerifyMessageReq,
    _signrpc_VerifyMessageResp,
    _signrpc_VerifyMessageReq__Output,
    _signrpc_VerifyMessageResp__Output
  >
}
