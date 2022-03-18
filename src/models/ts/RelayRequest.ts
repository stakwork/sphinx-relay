import { Request } from 'express'
export interface RelayRequest extends Request {
  owner: {
    id: number
    routeHint: string
    publicKey: string
  }
}
