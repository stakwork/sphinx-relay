// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface PayRequest {
  bolt11?: string
  label?: string
  maxfeepercent?: number | string
  retry_for?: number
  maxdelay?: number
  exemptfee?: _cln_Amount | null
  riskfactor?: number | string
  exclude?: string[]
  maxfee?: _cln_Amount | null
  description?: string
  amount_msat?: _cln_Amount | null
  localinvreqid?: Buffer | Uint8Array | string
  _amount_msat?: 'amount_msat'
  _label?: 'label'
  _riskfactor?: 'riskfactor'
  _maxfeepercent?: 'maxfeepercent'
  _retry_for?: 'retry_for'
  _maxdelay?: 'maxdelay'
  _exemptfee?: 'exemptfee'
  _localinvreqid?: 'localinvreqid'
  _maxfee?: 'maxfee'
  _description?: 'description'
}

export interface PayRequest__Output {
  bolt11: string
  label?: string
  maxfeepercent?: number
  retry_for?: number
  maxdelay?: number
  exemptfee?: _cln_Amount__Output | null
  riskfactor?: number
  exclude: string[]
  maxfee?: _cln_Amount__Output | null
  description?: string
  amount_msat?: _cln_Amount__Output | null
  localinvreqid?: Buffer
  _amount_msat: 'amount_msat'
  _label: 'label'
  _riskfactor: 'riskfactor'
  _maxfeepercent: 'maxfeepercent'
  _retry_for: 'retry_for'
  _maxdelay: 'maxdelay'
  _exemptfee: 'exemptfee'
  _localinvreqid: 'localinvreqid'
  _maxfee: 'maxfee'
  _description: 'description'
}
