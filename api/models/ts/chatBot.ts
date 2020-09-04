import { Table, Column, Model } from 'sequelize-typescript';

/*
TRIBE OWNER - bots installed as "contacts" in a tribe
*/

@Table({tableName: 'sphinx_chat_bots', underscored: true, indexes:[
  {unique:true, fields:['chat_id','bot_uuid']}
]})
export default class ChatBot extends Model<ChatBot> {

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
  meta: string // for saved preferences for local bots

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}