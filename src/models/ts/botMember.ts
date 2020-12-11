import { Table, Column, Model, DataType } from 'sequelize-typescript';

/*
BOT CREATOR - store the installers of your bot
*/

@Table({ tableName: 'sphinx_bot_members', underscored: true })
export default class BotMember extends Model<BotMember> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  botId: string

  @Column
  memberPubkey: string

  @Column
  tribeUuid: string

  @Column
  msgCount: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

}