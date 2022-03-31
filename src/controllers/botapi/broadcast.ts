import * as network from '../../network'
import { models } from '../../models'
import * as short from 'short-uuid'
import * as rsa from '../../crypto/rsa'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { getTribeOwnersChatByUUID } from '../../utils/tribes'
import { sphinxLogger } from '../../utils/logger'
import { Action } from './index'

export default async function broadcast(a: Action): Promise<void> {
  const {
    amount,
    content,
    bot_name,
    chat_uuid,
    msg_uuid,
    reply_uuid,
    parent_id,
  } = a

  sphinxLogger.info(`=> BOT BROADCAST`)
  if (!content) return sphinxLogger.error(`no content`)
  if (!chat_uuid) return sphinxLogger.error(`no chat_uuid`)
  const theChat = await getTribeOwnersChatByUUID(chat_uuid)
  if (!(theChat && theChat.id)) return sphinxLogger.error(`no chat`)
  if (theChat.type !== constants.chat_types.tribe)
    return sphinxLogger.error(`not a tribe`)
  const owner = await models.Contact.findOne({
    where: { id: theChat.tenant },
  })
  const tenant: number = owner.id

  const encryptedForMeText = rsa.encrypt(owner.contactKey, content)
  const encryptedText = rsa.encrypt(theChat.groupKey, content)
  const textMap = { chat: encryptedText }
  const date = new Date()
  date.setMilliseconds(0)
  const alias = bot_name || 'Bot'
  const botContactId = -1

  const msg: { [k: string]: string | number | Date } = {
    chatId: theChat.id,
    uuid: msg_uuid || short.generate(),
    type: constants.message_types.bot_res,
    sender: botContactId,
    amount: amount || 0,
    date: date,
    messageContent: encryptedForMeText,
    remoteMessageContent: JSON.stringify(textMap),
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
      type: 'message',
      response: jsonUtils.messageToJson(message, theChat, owner),
    },
    tenant
  )
  // console.log("BOT BROADCASE MSG", owner.dataValues)
  // console.log('+++++++++> MSG TO BROADCAST', message.dataValues)
  await network.sendMessage({
    chat: theChat,
    sender: {
      ...owner.dataValues,
      alias,
      id: botContactId,
      role: constants.chat_roles.reader,
    },
    message: {
      content: textMap,
      id: message.id,
      uuid: message.uuid,
      replyUuid: message.replyUuid,
      parentId: message.parentId || 0,
    },
    type: constants.message_types.bot_res,
    success: () => ({ success: true }),
    failure: (e) => {
      return sphinxLogger.error(e)
    },
    isForwarded: true,
  })
}
