// Original file: proto/lightning.proto

import type { MiddlewareRegistration as _lnrpc_MiddlewareRegistration, MiddlewareRegistration__Output as _lnrpc_MiddlewareRegistration__Output } from '../lnrpc/MiddlewareRegistration';
import type { InterceptFeedback as _lnrpc_InterceptFeedback, InterceptFeedback__Output as _lnrpc_InterceptFeedback__Output } from '../lnrpc/InterceptFeedback';
import type { Long } from '@grpc/proto-loader';

export interface RPCMiddlewareResponse {
  'ref_msg_id'?: (number | string | Long);
  'register'?: (_lnrpc_MiddlewareRegistration | null);
  'feedback'?: (_lnrpc_InterceptFeedback | null);
  'middleware_message'?: "register"|"feedback";
}

export interface RPCMiddlewareResponse__Output {
  'ref_msg_id': (string);
  'register'?: (_lnrpc_MiddlewareRegistration__Output | null);
  'feedback'?: (_lnrpc_InterceptFeedback__Output | null);
  'middleware_message': "register"|"feedback";
}
