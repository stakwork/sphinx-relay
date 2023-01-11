import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: 'sphinx_call_recording', underscored: true })
export default class CallRecording extends Model<CallRecording> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  })
  id: number

  @Column(DataType.TEXT)
  recordingId: string

  @Column
  createdBy: number

  @Column(DataType.TEXT)
  fileName: string

  @Column
  participants: number

  @Column(DataType.BIGINT)
  callLength: number

  @Column
  chatId: number

  @Column
  status: number

  @Column
  createdAt: Date

  @Column
  updatedAt: Date
}

export interface CallRecordingRecord extends CallRecording {
  dataValues: CallRecording
}
