import {SequelizeFields} from './sequelize'

export interface Contact extends SequelizeFields {
    id: number
    routeHint: string
    publicKey: string
    nodeAlias: string
    alias: string
    photoUrl: string
    privatePhoto: boolean
    isOwner: boolean
    deleted: boolean
    authToken: string
    remoteId: number
    status: number
    contactKey: string
    deviceId: string
    createdAt: Date
    updatedAt: Date
    fromGroup: boolean
    notificationSound: string
    lastActive: Date
    tipAmount: number
    tenant: number
    priceToMeet: number
    unmet: boolean
}