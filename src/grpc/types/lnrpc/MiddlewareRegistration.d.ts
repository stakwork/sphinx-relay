// Original file: proto/lightning.proto

export interface MiddlewareRegistration {
  middleware_name?: string
  custom_macaroon_caveat_name?: string
  read_only_mode?: boolean
}

export interface MiddlewareRegistration__Output {
  middleware_name: string
  custom_macaroon_caveat_name: string
  read_only_mode: boolean
}
