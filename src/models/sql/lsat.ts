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
    type: DataType.STRING,
  })
  identifier: string

  @CreatedAt
  createdAt: Date

  @UpdatedAt
  updatedAt: Date

  @Column
  macaroon: string

  @Column
  paymentRequest: string

  @Column
  preimage: string

  @Column
  issuer: string

  // an optional, comma separated list of paths
  // where the lsat can be used for
  @Column
  paths: string

  // opting to leave this open-ended for now
  // and can be up to consumer to determine what types it's expecting
  // and what to do with it based on the type (e.g. image url, json blob)
  @Column
  metadata: string

  @Column
  tenant: number
}
