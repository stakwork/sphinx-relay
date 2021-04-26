
export interface Message {
    id: number
    uuid: string
    chatId: number
    type: number
    sender: number
    receiver: number
    amount: number
    amountMsat: number
    paymentHash: string
    paymentRequest: string
    date: Date
    expirationDate: Date
    messageContent: string
    remoteMessageContent: string
    status: number
    statusMap: string
    parentId: number
    subscriptionId: number
    mediaKey: string
    mediaType: string
    mediaToken: string
    seen: boolean
    createdAt: Date
    updatedAt: Date
    senderAlias: string // for tribes, no "sender" id maybe
    senderPic: string // for tribes, no "sender" id maybe
    originalMuid: string // for tribe, remember the og muid
    replyUuid: string
    network_type: number
    tenant: number
}