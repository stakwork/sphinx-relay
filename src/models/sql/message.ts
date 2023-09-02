import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_messages', underscored: true })
export default class Message extends Model<Message> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  uuid: string

  @Column(DataType.BIGINT)
  chatId: number

  @Column(DataType.BIGINT)
  type: number

  @Column(DataType.BIGINT)
  sender: number

  @Column(DataType.BIGINT)
  receiver: number

  @Column(DataType.DECIMAL)
  amount: number

  @Column(DataType.DECIMAL)
  amountMsat: number

  @Column
  paymentHash: string

  @Column(DataType.TEXT)
  paymentRequest: string

  @Column
  date: Date

  @Column
  expirationDate: Date

  @Column(DataType.TEXT)
  messageContent: string

  @Column(DataType.TEXT)
  remoteMessageContent: string

  @Column(DataType.BIGINT)
  status: number

  @Column(DataType.TEXT)
  statusMap: string

  @Column(DataType.BIGINT)
  parentId: number

  @Column(DataType.BIGINT)
  subscriptionId: number

  @Column(DataType.TEXT)
  mediaKey: string

  @Column
  mediaType: string

  @Column(DataType.TEXT)
  mediaToken: string

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  seen: boolean

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

  @Column
  senderAlias: string // for tribes, no "sender" id maybe

  @Column(DataType.TEXT)
  senderPic: string // for tribes, no "sender" id maybe

  @Column
  originalMuid: string // for tribe, remember the og muid

  @Column
  replyUuid: string

  @Column(DataType.INTEGER)
  network_type: number

  @Column
  tenant: number

  @Column
  recipientAlias: string // for direct payment display in tribes

  @Column(DataType.TEXT)
  recipientPic: string // for direct payment display in tribes

  @Column
  person: string

  @Column
  forwardedSats: boolean

  @Column
  push: boolean

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  onlyOwner: boolean

  @Column(DataType.TEXT)
  errorMessage: string // for error message when sending messages by keysend

  @Column(DataType.TEXT)
  thread_uuid: string // for which thread the message belongs to
}

/*
ALTER TABLE sphinx_invites ALTER COLUMN invoice TYPE text;
*/

export interface MessageRecord extends Message {
  dataValues: Message
}
