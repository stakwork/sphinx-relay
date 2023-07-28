import type { Contact } from '../models'
import * as ldat from '../utils/ldat'

export interface MessageContent {
  uuid: string
  content: string | { [k: string]: string }
  amount: number
  id?: number
  replyUuid?: string
  mediaToken?: string
  mediaKey?: string
  mediaType?: string
  date?: Date
  originalMuid?: string
  status?: number
  purchaser?: number
  invoice?: string
  parentId?: number
  push?: boolean
  mediaTerms?: ldat.LdatTerms
  skipPaymentProcessing?: boolean
  recipientAlias?: string
  recipientPic?: string
  person?: string
  thread_uuid?: string
}

export type ChatMembers = { [k: string]: ChatMember }

// fro group join msgs, etc
export interface ChatMember {
  role?: number
  key: string
  alias: string
}

export interface ChatContent {
  uuid: string
  type?: number
  members?: { [k: string]: ChatMember }
  name?: string
  groupKey?: string
  host?: string
  myAlias?: string
  myPhotoUrl?: string
}

export interface SenderContent {
  id?: number
  pub_key: string
  alias: string
  role: number
  route_hint?: string
  photo_url?: string
  contact_key?: string
  person?: string
}

export interface Msg {
  type: number
  message: MessageContent
  chat: ChatContent
  sender: SenderContent
  error_message?: string
}

export interface BotMsg extends Msg {
  bot_id?: any
  bot_uuid?: string
  bot_name?: string
  recipient_id?: any
  action?: string
}

interface PayloadMessageContent extends MessageContent {
  remoteContent?: string
  skipPaymentProcessing?: boolean
}

export interface Payload extends BotMsg, AdminPayload {
  network_type?: number
  dest?: string
  owner: Contact
  message: PayloadMessageContent
  error_message?: string
}

export interface AdminPayload {
  isTribeOwner?: boolean
  hasForwardedSats?: boolean
}
