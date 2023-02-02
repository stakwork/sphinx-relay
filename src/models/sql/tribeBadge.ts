import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_tribe_badge', underscored: true })
export default class TribeBadge extends Model<TribeBadge> {
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
  chatId: number

  @Column
  rewardType: number

  @Column
  rewardRequirement: number

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  deleted: boolean

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface TribeBadgeRecord extends TribeBadge {
  dataValues: TribeBadge
}
