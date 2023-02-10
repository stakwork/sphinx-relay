import { Table, Column, Model, DataType } from 'sequelize-typescript'
// id | Title | Desc | link | current_version_id | chatId | tenant | createdAt | updatedAt

@Table({ tableName: 'sphinx_recurring_calls', underscored: true })
export default class RecurringCall extends Model<RecurringCall> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  title: string

  @Column
  description: string

  @Column
  link: string

  @Column
  currentVersionId: string

  @Column
  chatId: number

  @Column
  tenant: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface RecurringCallRecord extends RecurringCall {
  dataValues: RecurringCall
}
