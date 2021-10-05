export * from './jsonModels'

export interface NodeConfig {
  alias: string
  pubkey: string
  ip: string
  external_ip: string
  authToken: string
  contact_key: string
  privkey: string
  exported_keys: string
  pin: string
  routeHint: string
}

export interface RequestBody {
  [key: string]: unknown
}

export interface Headers {
  'x-user-token': string
  [key: string]: string
}

export interface RequestArgs {
  headers: Headers
  body: RequestBody
}
