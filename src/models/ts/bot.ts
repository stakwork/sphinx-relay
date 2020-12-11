import { Table, Column, Model, DataType } from 'sequelize-typescript';

/*
BOT CREATOR - this handles the webhook and external API
*/

@Table({ tableName: 'sphinx_bots', underscored: true })
export default class Bot extends Model<Bot> {

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
    unique: true,
  })
  id: string

  @Column
  uuid: string

  @Column
  name: string

  @Column
  secret: string

  @Column
  webhook: string

  @Column
  pricePerUse: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

}