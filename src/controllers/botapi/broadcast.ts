import * as short from 'short-uuid'
import * as network from '../../network'
import { models, Message, ChatRecord, ContactRecord } from '../../models'
import * as rsa from '../../crypto/rsa'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { sphinxLogger, logging } from '../../utils/logger'
import { ChatPlusMembers } from '../../network/send'
import { Action, validateAction } from './index'

export default async function broadcast(a: Action): Promise<void> {
  const {
    amount,
    content,
    bot_name,
    msg_uuid,
    reply_uuid,
    parent_id,
    bot_pic,
    only_owner,
    only_user,
    only_pubkey,
  } = a

  sphinxLogger.info(`=> BOT BROADCAST`)
  const ret = await validateAction(a)
  if (!ret) return
  const { chat, owner } = ret
  const tenant: number = owner.id

  if (only_user || only_pubkey) {
    if (only_user) {
      chat.contactIds = `[${only_user}]`
    } else {
      try {
        const user = (await models.Contact.findOne({
          where: { tenant, publicKey: only_pubkey! },
        })) as ContactRecord
        chat.contactIds = `[${user.id}]`
      } catch (error) {
        sphinxLogger.error(`=> ONLY_PUBKEY ERROR ${error}`, logging.Bots)
        return
      }
    }
  }

  const encryptedForMeText = rsa.encrypt(owner.contactKey, content || '')
  const encryptedText = rsa.encrypt(chat.groupKey, content || '')
  const textMap = { chat: encryptedText }
  const date = new Date()
  date.setMilliseconds(0)
  const alias = bot_name || 'Bot'
  const botContactId = -1

  const msg: { [k: string]: string | number | Date | boolean } = {
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
    onlyOwner: only_owner || only_user || only_pubkey ? true : false,
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
  if (!only_owner) {
    await network.sendMessage({
      chat: chat as ChatPlusMembers,
      sender: {
        ...owner.dataValues,
        alias,
        id: botContactId,
        role: constants.chat_roles.reader,
        photoUrl: bot_pic || '',
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
}
