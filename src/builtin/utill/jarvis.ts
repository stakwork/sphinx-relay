import { botResponse, findBot } from './'
import * as Sphinx from 'sphinx-bot'
import { ChatBotRecord, ChatRecord, MessageRecord, models } from '../../models'
import { sphinxLogger, logging } from '../../utils/logger'
import constants from '../../constants'
import fetch from 'node-fetch'

export interface JarvisMeta {
  url: string
}

interface UpdateLinkInput {
  botPrefix: string
  command: string
  botMessage: Sphinx.Message
  tribe: ChatRecord
  url: string
  isAdmin: boolean
  botName: string
}

interface SendMessageToJarvisInput {
  isAdmin: boolean
  message: Sphinx.Message
  tribe: ChatRecord
  botPrefix: string
}

export async function updateLink({
  botPrefix,
  command,
  botMessage,
  tribe,
  url,
  isAdmin,
  botName,
}: UpdateLinkInput) {
  try {
    const bot: ChatBotRecord = await findBot({ botPrefix, tribe })
    let meta: JarvisMeta = JSON.parse(bot.meta || `{}`)
    meta.url = url
    await bot.update({ meta: JSON.stringify(meta) })
    sendMessageToJarvis({ isAdmin, message: botMessage, tribe, botPrefix })
    return await botResponse(
      botName,
      'Jarvis link updated successfullt',
      botPrefix,
      tribe.id,
      botMessage,
      command
    )
  } catch (error) {
    sphinxLogger.error([`JARVIS BOT ERROR ${error}`, logging.Bots])
    return await botResponse(
      botName,
      'Error updating link',
      botPrefix,
      tribe.id,
      botMessage,
      command
    )
  }
}

export async function sendMessageToJarvis({
  isAdmin,
  message,
  tribe,
  botPrefix,
}: SendMessageToJarvisInput) {
  console.log('=====> save message hit<======')
  let isAdminOnlyMessage: boolean = false
  if (isAdmin) {
    checkAdminOnlyMessage()
  }
  if (!isAdminOnlyMessage) {
    try {
      const savedMessage = (await models.Message.findOne({
        where: { uuid: message.id!, tenant: tribe.tenant },
      })) as MessageRecord
      const bot = await findBot({ botPrefix, tribe })
      let meta: JarvisMeta = JSON.parse(bot.meta || `{}`)
      const parsedJarvisMsg = parseMessage(savedMessage)
      let jarvisMsg
      if (savedMessage.type === constants.message_types.attachment) {
        const msgContent = JSON.parse(message.content || `{}`)
        jarvisMsg = {
          ...parsedJarvisMsg,
          media_key: msgContent.media_key,
          message_content: msgContent.content,
        }
      } else {
        jarvisMsg = { ...parsedJarvisMsg, message_content: message.content }
      }

      //Make Api call to Javis
      if (meta?.url) {
        console.log('====> Url set <====', jarvisMsg)
        const res = await fetch(meta.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jarvisMsg),
        })
        console.log(await res.json())
      }
    } catch (error) {
      sphinxLogger.error([
        `JARVIS BOT ERROR WHILE SENDING TO JARVIS BACKEND ${error}`,
        logging.Bots,
      ])
    }
  }
  return
}

export async function checkAdminOnlyMessage() {}

function parseMessage(message: MessageRecord) {
  return {
    amount: message.amount,
    amount_msat: message.amountMsat,
    chat_id: message.chatId,
    created_at: message.createdAt,
    date: message.date,
    expiration_date: message.expirationDate,
    id: message.id,
    media_key: message.mediaKey,
    media_token: message.mediaToken,
    media_type: message.mediaType,
    message_content: message.messageContent,
    network_type: message.network_type,
    original_muid: message.originalMuid,
    parent_id: message.parentId,
    payment_hash: message.paymentHash,
    payment_request: message.paymentRequest,
    recipient_alias: message.recipientAlias,
    recipient_pic: message.recipientPic,
    reply_uuid: message.replyUuid,
    sender: message.sender,
    sender_alias: message.senderAlias,
    sender_pic: message.senderPic,
    status: message.status,
    type: message.type,
    updated_at: message.updatedAt,
    uuid: message.uuid,
  }
}
