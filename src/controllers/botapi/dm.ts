import * as md5 from 'md5'
import * as short from 'short-uuid'
import { sphinxLogger } from '../../utils/logger'
import { models, ChatRecord, ContactRecord } from '../../models'
import constants from '../../constants'
import * as network from '../../network'
import * as rsa from '../../crypto/rsa'
import { Action, validateAction } from './index'

export default async function dm(a: Action): Promise<void> {
  const { amount, content, pubkey } = a

  sphinxLogger.info(`=> BOT DM ${JSON.stringify(a, null, 2)}`)
  const ret = await validateAction(a)
  if (!ret) return
  const owner = ret.owner
  const tenant: number = owner.id
  // const alias = bot_name || owner.alias
  if (!pubkey) return sphinxLogger.error('bot DM no pubkey')
  if (pubkey.length !== 66) return sphinxLogger.error('bot DM bad pubkey')

  const contact = (await models.Contact.findOne({
    where: { publicKey: pubkey, tenant },
  })) as ContactRecord
  if (!contact) return sphinxLogger.error('bot DM no contact')

  const uuid = md5([owner.publicKey, pubkey].sort().join('-'))

  let chat: ChatRecord = (await models.Chat.findOne({
    where: { uuid },
  })) as ChatRecord
  if (!chat) {
    // no chat! create new
    const date = new Date()
    date.setMilliseconds(0)
    sphinxLogger.info(`=> no chat! create new`)
    chat = (await models.Chat.create({
      uuid: uuid,
      contactIds: JSON.stringify([tenant, contact.id]),
      createdAt: date,
      updatedAt: date,
      type: constants.chat_types.conversation,
      tenant,
    })) as ChatRecord
  }

  const encryptedContent = rsa.encrypt(contact.contactKey, content || '')
  await network.sendMessage({
    chat: chat as any,
    sender: owner.dataValues,
    message: {
      content: encryptedContent,
      amount: amount || 0,
      uuid: short.generate(),
    },
    type: constants.message_types.message,
    success: () => ({ success: true }),
    failure: (e) => {
      return sphinxLogger.error(e)
    },
  })
}
