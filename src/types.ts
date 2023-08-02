import * as express from 'express'
import { Contact } from './models'

export interface Req extends express.Request {
  owner: Contact
  rawBody: string
}

export interface Badge {
  id: number
  icon: string
  name: string
  asset: string
  token: string
  amount: number
  creator: string
}

export type Res = express.Response

export interface SpamGoneMeta {
  pubkeys: {
    pubkey: string
    alias: string
  }[]
}
