import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_accountings', underscored: true })
export default class Accounting extends Model<Accounting> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  date: Date

  @Column
  pubkey: string

  @Column
  onchainAddress: string

  @Column(DataType.DECIMAL)
  amount: number

  @Column
  sourceApp: string

  @Column(DataType.BIGINT)
  status: number

  @Column
  error: string

  @Column(DataType.BIGINT)
  chanId: number

  @Column
  fundingTxid: string

  @Column
  onchainTxid: string

  @Column(DataType.BIGINT)
  commitFee: number

  @Column(DataType.BIGINT)
  localReserve: number

  @Column(DataType.BIGINT)
  remoteReserve: number

  @Column(DataType.BIGINT)
  extraAmount: number

}