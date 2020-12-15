import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_contacts', underscored: true })
export default class Contact extends Model<Contact> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  publicKey: string

  @Column
  nodeAlias: string

  @Column
  alias: string

  @Column
  photoUrl: string

  @Column
  privatePhoto: boolean

  @Column
  isOwner: boolean

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  deleted: boolean

  @Column
  authToken: string

  @Column(DataType.BIGINT)
  remoteId: number

  @Column(DataType.BIGINT)
  status: number

  @Column(DataType.TEXT)
  contactKey: string

  @Column
  deviceId: string

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

  @Column
  fromGroup: boolean

  @Column
  notificationSound: string

  @Column
  lastActive: Date

  @Column(DataType.BIGINT)
  tipAmount: number

}