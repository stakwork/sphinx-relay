import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_graph_subscription_chat', underscored: true })
export default class GraphSubscriptionChat extends Model<GraphSubscriptionChat> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column(DataType.BIGINT)
  graphSubscriptionId: number

  @Column(DataType.BIGINT)
  chatId: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface GraphSubscriptionChatRecord extends GraphSubscriptionChat {
  dataValues: GraphSubscriptionChat
}
