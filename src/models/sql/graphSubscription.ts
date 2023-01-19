import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_graph_subscription', underscored: true })
export default class GraphSubscription extends Model<GraphSubscription> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column(DataType.TEXT)
  name: string

  @Column
  address: string

  @Column(DataType.TEXT)
  weight: string

  //   This would either be 1 or 0
  @Column
  status: number

  @Column
  tenant: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface GraphSubscriptionRecord extends GraphSubscription {
  dataValues: GraphSubscription
}
