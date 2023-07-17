import * as short from 'short-uuid'
import * as network from '../../network'
import { models, Message } from '../../models'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { sphinxLogger } from '../../utils/logger'
import { errMsgString } from '../../utils/errMsgString'
import { Action, validateAction } from './index'

export default async function pay(a: Action): Promise<void> {
  const { amount, bot_name, msg_uuid, reply_uuid, recipient_id, parent_id } = a

  sphinxLogger.info(`=> BOT PAY ${JSON.stringify(a, null, 2)}`)
  if (!a.recipient_id) return sphinxLogger.error(`no recipient_id`)
  const ret = await validateAction(a)
  if (!ret) return
  const { chat, owner } = ret
  const tenant: number = owner.id
  const alias = bot_name || owner.alias
  const botContactId = -1

  const date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
    uuid: msg_uuid || short.generate(),
    type: constants.message_types.boost,
    sender: botContactId, // tribe owner is escrow holder
    amount: amount || 0,
    date: date,
    status: constants.statuses.confirmed,
    replyUuid: reply_uuid || '',
    createdAt: date,
    updatedAt: date,
    senderAlias: alias,
    tenant,
  }
  if (parent_id) msg.parentId = parent_id
  const message: Message = (await models.Message.create(msg)) as Message
  socket.sendJson(
    {
      type: 'boost',
      response: jsonUtils.messageToJson(message, chat, owner),
    },
    tenant
  )

  await network.sendMessage({
    chat: chat as any,
    sender: {
      ...owner.dataValues,
      alias,
      id: botContactId,
      role: constants.chat_roles.owner,
    },
    message: {
      content: '',
      amount: message.amount,
      id: message.id,
      uuid: message.uuid,
      replyUuid: message.replyUuid,
      parentId: message.parentId || 0,
    },
    type: constants.message_types.boost,
    success: () => ({ success: true }),
    failure: async (e) => {
      const errorMsg = errMsgString(e)
      await message.update({
        errorMessage: errorMsg,
        status: constants.statuses.failed,
      })
      return sphinxLogger.error(e)
    },
    isForwarded: true,
    realSatsContactId: recipient_id,
  })
}
