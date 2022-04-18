import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_requests_transport_tokens', underscored: true })
export default class RequestsTransportTokens extends Model<RequestsTransportTokens> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column(DataType.TEXT)
  transportToken: string

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}
