import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_content_feed_status', underscored: true })
export default class ContentFeedStatus extends Model<ContentFeedStatus> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  feedId: string

  @Column
  feedUrl: string

  @Column(DataType.BOOLEAN)
  subscriptionStatus: boolean

  @Column
  itemId: string

  @Column(DataType.TEXT)
  episodesStatus: string

  @Column
  chatId: number

  @Column
  satsPerMinute: number

  @Column(DataType.REAL)
  playerSpeed: number

  @Column
  tenant: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface ContentFeedStatusRecord extends ContentFeedStatus {
  dataValues: ContentFeedStatus
}
