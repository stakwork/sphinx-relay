import * as network from '../../network'
import { models } from '../../models'
import * as short from 'short-uuid'
import * as jsonUtils from '../../utils/json'
import * as socket from '../../utils/socket'
import constants from '../../constants'
import { getTribeOwnersChatByUUID } from '../../utils/tribes'

export default async function pay(a) {
  const { amount, bot_name, chat_uuid, msg_uuid, reply_uuid, recipient_id } = a

  console.log('=> BOT PAY', JSON.stringify(a, null, 2))
  if (!recipient_id) return console.log('no recipient_id')
  if (!chat_uuid) return console.log('no chat_uuid')
  const theChat = await getTribeOwnersChatByUUID(chat_uuid)
  if (!(theChat && theChat.id)) return console.log('no chat')
  if (theChat.type !== constants.chat_types.tribe)
    return console.log('not a tribe')
  const owner = await models.Contact.findOne({
    where: { id: theChat.tenant },
  })
  const tenant: number = owner.id
  const alias = bot_name || owner.alias
  const botContactId = -1

  var date = new Date()
  date.setMilliseconds(0)
  const msg: { [k: string]: any } = {
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
    },
    type: constants.message_types.boost,
    success: () => ({ success: true }),
    failure: (e) => {
      return console.log(e)
    },
    isForwarded: true,
    realSatsContactId: recipient_id,
  })
}
