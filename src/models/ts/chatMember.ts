import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  tableName: 'sphinx_chat_members', underscored: true, indexes: [
    { unique: true, fields: ['chat_id', 'contact_id'] }
  ]
})
export default class ChatMember extends Model<ChatMember> {

  @Column
  chatId: number

  @Column
  contactId: number

  @Column
  role: number

  @Column
  totalSpent: number

  @Column
  totalMessages: number

  @Column
  lastActive: Date

  @Column
  status: number

  @Column
  lastAlias: string

}