import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sphinx_invites', underscored: true })
export default class Invite extends Model<Invite> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  id: number

  @Column
  inviteString: string

  @Column
  invoice: string

  @Column
  welcomeMessage: string

  @Column(DataType.BIGINT)
  contactId: number

  @Column(DataType.BIGINT)
  status: number

  @Column(DataType.DECIMAL(10, 2))
  price: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date

}