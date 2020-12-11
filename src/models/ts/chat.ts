import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_chats', underscored: true })
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

  @Column({ // dont show on tribes list
    type: DataType.BOOLEAN,
    defaultValue: false,
    // allowNull: false
  })
  unlisted: boolean

  @Column
  private: boolean // joining requires approval of admin

  @Column
  ownerPubkey: string

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  seen: boolean

  @Column
  appUrl: string

  @Column
  feedUrl: string

  @Column
  meta: string

  @Column
  myPhotoUrl: string

  @Column
  myAlias: string

}