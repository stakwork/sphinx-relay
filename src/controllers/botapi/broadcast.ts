import * as network from '../../network'
import { models, Message, ChatRecord } from '../../models'
import * as short from 'short-uuid'
import * as rsa from '../../crypto/rsa'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { sphinxLogger } from '../../utils/logger'
import { Action, validateAction } from './index'
import { ChatPlusMembers } from '../../network/send'

export default async function broadcast(a: Action): Promise<void> {
  const {
    amount,
    content,
    bot_name,
    msg_uuid,
    reply_uuid,
    parent_id,
    bot_pic,
  } = a

  sphinxLogger.info(`=> BOT BROADCAST`)
  const ret = await validateAction(a)
  if (!ret) return
  const { chat, owner } = ret
  const tenant: number = owner.id

  const encryptedForMeText = rsa.encrypt(owner.contactKey, content || '')
  const encryptedText = rsa.encrypt(chat.groupKey, content || '')
  const textMap = { chat: encryptedText }
  const date = new Date()
  date.setMilliseconds(0)
  const alias = bot_name || 'Bot'
  const botContactId = -1

  const msg: { [k: string]: string | number | Date } = {
    chatId: chat.id,
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
  if (bot_pic) msg.senderPic = bot_pic
  const unseenChat = (await models.Chat.findOne({
    where: { id: chat.id, tenant },
  })) as ChatRecord

  if (unseenChat) unseenChat.update({ seen: false })
  const message: Message = (await models.Message.create(msg)) as Message
  socket.sendJson(
    {
      type: 'message',
      response: jsonUtils.messageToJson(message, chat, owner),
    },
    tenant
  )
  // console.log("BOT BROADCASE MSG", owner.dataValues)
  // console.log('+++++++++> MSG TO BROADCAST', message.dataValues)
  await network.sendMessage({
    chat: chat as ChatPlusMembers,
    sender: {
      ...owner.dataValues,
      alias,
      id: botContactId,
      role: constants.chat_roles.reader,
      ...(bot_pic && { photoUrl: bot_pic }),
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
