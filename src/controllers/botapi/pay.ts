// @ts-nocheck
import * as network from '../../network'
import { models } from '../../models'
import * as short from 'short-uuid'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { getTribeOwnersChatByUUID } from '../../utils/tribes'
import { sphinxLogger } from '../../utils/logger'
import { Action } from './index'

export default async function pay(a: Action): Promise<void> {
  const {
    amount,
    bot_name,
    chat_uuid,
    msg_uuid,
    reply_uuid,
    recipient_id,
    parent_id,
  } = a

  sphinxLogger.info(`=> BOT PAY ${JSON.stringify(a, null, 2)}`)
  if (!recipient_id) return sphinxLogger.error(`no recipient_id`)
  if (!chat_uuid) return sphinxLogger.error(`no chat_uuid`)
  const theChat = await getTribeOwnersChatByUUID(chat_uuid)
  if (!(theChat && theChat.id)) return sphinxLogger.error(`no chat`)
  if (theChat.type !== constants.chat_types.tribe)
    return sphinxLogger.error(`not a tribe`)
  const owner = await models.Contact.findOne({
    where: { id: theChat.tenant },
  })
  const tenant: number = owner.id
  const alias = bot_name || owner.alias
  const botContactId = -1

  const date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: string | number | Date } = {
    chatId: theChat.id,
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
  const message = await models.Message.create(msg)
  socket.sendJson(
    {
      type: 'boost',
      response: jsonUtils.messageToJson(message, theChat, owner),
    },
    tenant
  )

  await network.sendMessage({
    chat: theChat,
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
    failure: (e) => {
      return sphinxLogger.error(e)
    },
    isForwarded: true,
    realSatsContactId: recipient_id,
  })
}
