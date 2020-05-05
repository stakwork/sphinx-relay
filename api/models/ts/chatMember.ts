import { Table, Column, Model } from 'sequelize-typescript';

@Table({tableName: 'sphinx_chat_members', underscored: true})
export default class ChatMember extends Model<ChatMember> {

  @Column
  chat_id: number

  @Column
  contact_id: number

  @Column
  role: number

  @Column
  totalSpent: number

  @Column
  totalMessages: number

  @Column
  lastActive: Date

}