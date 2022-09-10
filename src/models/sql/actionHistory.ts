import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_action_history', underscored: true })
export default class ActionHistory extends Model<ActionHistory> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  type: string

  @Column(DataType.TEXT)
  metaData: string
}

export interface ActionHistoryRecord extends ActionHistory {
  dataValues: ActionHistory
}
