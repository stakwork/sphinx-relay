import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({tableName: 'sphinx_chats', underscored: true})
export default class Chat extends Model<Chat> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  uuid: string

  @Column
  name: string

  @Column
  photoUrl: string

  @Column(DataType.BIGINT)
  type: number

  @Column(DataType.BIGINT)
  status: number

  @Column
  contactIds: string

  @Column
  isMuted: boolean

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  deleted: boolean

  @Column
  groupKey: string

  @Column
  groupPrivateKey: string

  @Column
  host: string

  @Column
  priceToJoin: number

  @Column
  pricePerMessage: number

  @Column(DataType.BIGINT)
  escrowAmount: number

  @Column(DataType.BIGINT)
  escrowMillis: number

  @Column 
  ownerPubkey: string

}