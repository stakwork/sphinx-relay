import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_timers', underscored: true })
export default class Timer extends Model<Timer> {

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
  msgId: number

  @Column(DataType.BIGINT)
  millis: number

  @Column(DataType.BIGINT)
  receiver: number

  @Column(DataType.DECIMAL)
  amount: number

}