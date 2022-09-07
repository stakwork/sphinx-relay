import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_local_data', underscored: true })
export default class LocalData extends Model<LocalData> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column(DataType.BIGINT)
  boost: number

  @Column(DataType.BIGINT)
  date: number

  @Column(DataType.TEXT)
  description: string

  @Column
  episodeTitle: string

  @Column
  guest: string

  @Column
  imageUrl: string

  @Column
  keyword: boolean

  @Column
  link: string

  @Column
  nodeType: string

  @Column
  refId: string

  @Column
  showTitle: string

  @Column(DataType.TEXT)
  text: string

  @Column
  timestamp: string

  @Column
  topics: string

  @Column
  weight: number

  @Column
  firstInteraction: number

  @Column
  history: string

  @Column({
    defaultValue: 1,
  })
  searchFrequency: number

  @Column
  tenant: number
}

export interface LocalDataRecord extends LocalData {
  dataValues: LocalData
}
