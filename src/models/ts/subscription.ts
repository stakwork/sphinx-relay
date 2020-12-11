import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_subscriptions', underscored: true })
export default class Subscription extends Model<Subscription> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column(DataType.BIGINT)
  chatId: number

  @Column(DataType.BIGINT)
  contactId: number

  @Column(DataType.TEXT)
  cron: string

  @Column(DataType.DECIMAL)
  amount: number

  @Column(DataType.DECIMAL)
  totalPaid: number

  @Column(DataType.BIGINT)
  endNumber: number

  @Column
  endDate: Date

  @Column(DataType.BIGINT)
  count: number

  @Column
  ended: boolean

  @Column
  paused: boolean

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}