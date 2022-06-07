import { Contact } from './contact'

export interface Chat {
  id: number
  uuid: string
  name: string
  photoUrl: string
  type: number
  status: number
  contactIds: string
  isMuted: boolean
  createdAt: Date
  updatedAt: Date
  deleted: boolean
  groupKey: string
  groupPrivateKey: string
  host: string
  priceToJoin: number
  pricePerMessage: number
  escrowAmount: number
  escrowMillis: number
  unlisted: boolean
  private: boolean // joining requires approval of admin
  ownerPubkey: string
  seen: boolean
  appUrl: string
  feedUrl: string
  feedType: number
  meta: string
  myPhotoUrl: string
  myAlias: string
  tenant: number
  skipBroadcastJoins: boolean
  pin: string

  dataValues: { [k: string]: any }
  update: Function
  members: { [k: string]: { [k: string]: string | number } }
  pendingContactIds?: number[]
}

export interface ChatRecord extends Chat {
  dataValues: Contact
  pendingContactIds: Array<string>
}

export interface ChatRecord extends Chat {
  dataValues: Contact
  pendingContactIds: Array<string>
}
