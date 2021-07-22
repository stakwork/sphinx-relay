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
  meta: string
  myPhotoUrl: string
  myAlias: string
  tenant: number
  skipBroadcastJoins: boolean
}
