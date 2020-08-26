import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({tableName: 'sphinx_bots', underscored: true})
export default class Bot extends Model<Bot> {

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
    unique: true,
  })
  id: string

  @Column(DataType.BIGINT)
  chatId: number

  @Column
  name: string

  @Column
  secret: string

}