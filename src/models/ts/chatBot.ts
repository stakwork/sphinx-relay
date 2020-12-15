import { Table, Column, Model, DataType } from 'sequelize-typescript';

/*
TRIBE OWNER - bots installed as "contacts" in a tribe
*/

@Table({
  tableName: 'sphinx_chat_bots', underscored: true, indexes: [
    { unique: true, fields: ['chat_id', 'bot_uuid'] }
  ]
})
export default class ChatBot extends Model<ChatBot> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  chatId: number

  @Column
  botUuid: string

  @Column
  botType: number

  @Column
  botPrefix: string

  @Column
  botMakerPubkey: string

  @Column
  msgTypes: string

  @Column
  meta: string // for saved preferences for local bots

  @Column
  pricePerUse: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}