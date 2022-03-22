import * as express from 'express'
import { Contact } from './models'

export interface Req extends express.Request {
  owner: Contact
  rawBody: string
}
