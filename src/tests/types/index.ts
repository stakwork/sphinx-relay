export * from './jsonModels'

export interface NodeConfig {
  alias: string
  pubkey: string
  ip: string
  external_ip: string
  authToken: string
  transportToken: string
  contact_key: string
  privkey: string
  exported_keys: string
  pin: string
  routeHint: string
}

export interface RequestBody {
  [k: string]: unknown
}

export interface Headers {
  [k: string]: string
}

export interface RequestArgs {
  headers: Headers
  body: RequestBody
}
