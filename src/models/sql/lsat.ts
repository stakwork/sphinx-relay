import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'

@Table({
  tableName: 'sphinx_lsats',
  underscored: true,
  indexes: [{ unique: true, fields: ['id', 'identifier'] }],
})
export default class Lsat extends Model<Lsat> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number

  @Column({
    type: DataType.TEXT,
  })
  identifier: string

  @CreatedAt
  createdAt: Date

  @UpdatedAt
  updatedAt: Date

  @Column({
    type: DataType.TEXT,
  })
  macaroon: string

  @Column({
    type: DataType.TEXT,
  })
  paymentRequest: string

  @Column({
    type: DataType.TEXT,
  })
  preimage: string

  @Column({
    type: DataType.TEXT,
  })
  issuer: string

  // an optional, comma separated list of paths
  // where the lsat can be used for
  @Column({
    type: DataType.TEXT,
  })
  paths: string

  // opting to leave this open-ended for now
  // and can be up to consumer to determine what types it's expecting
  // and what to do with it based on the type (e.g. image url, json blob)
  @Column({
    type: DataType.TEXT,
  })
  metadata: string

  @Column({ type: DataType.INTEGER })
  status: number

  @Column
  tenant: number
}
