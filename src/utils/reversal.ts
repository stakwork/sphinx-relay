import { models, MessageRecord, ChatRecord, ContactRecord } from '../models'
import * as socket from './socket'
import constants from '../constants'
import * as jsonUtils from './json'

interface ReversalInput {
  tenant: number
  type: string
  errorMsg: string
  msgUuid: string
  chat: ChatRecord
  sender: ContactRecord
}

export async function onReceiveReversal({
  tenant,
  type,
  errorMsg,
  msgUuid,
  chat,
  sender,
}: ReversalInput) {
  await models.Message.update(
    {
      errorMessage: errorMsg,
      status: constants.statuses.failed,
    },
    {
      where: { tenant, uuid: msgUuid },
    }
  )

  const updatedPrevMsg = (await models.Message.findOne({
    where: { tenant, uuid: msgUuid },
  })) as MessageRecord

  socket.sendJson(
    {
      type,
      response: jsonUtils.messageToJson(updatedPrevMsg, chat, sender),
    },
    tenant
  )
  return
}
