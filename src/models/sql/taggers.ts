import { Table, Column, Model, DataType, AllowNull } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_tagger', underscored: true })
export default class Tagger extends Model<Tagger> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  pubkey: string

  @Column
  tenant: number

  @Column
  type: string

  @Column(DataType.DECIMAL)
  amount: number

  @Column
  redId: string

  @Column
  status: number

  @AllowNull(true)
  @Column
  timestamp: string
}

export interface TaggerRecord extends Tagger {
  dataValues: Tagger
}
