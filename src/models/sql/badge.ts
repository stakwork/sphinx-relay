import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_badge', underscored: true })
export default class Badge extends Model<Badge> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column
  badgeId: number

  @Column
  name: string

  @Column
  host: string

  @Column(DataType.TEXT)
  memo: string

  @Column
  tenant: number

  @Column
  type: number

  @Column
  asset: string

  @Column(DataType.BOOLEAN)
  deleted: boolean

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface BadgeRecord extends Badge {
  dataValues: Badge
}
