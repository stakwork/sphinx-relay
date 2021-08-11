import * as network from '../network'
import { models } from '../models'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'
import * as jsonUtils from '../utils/json'
import * as socket from '../utils/socket'
import { success, failure } from '../utils/res'
import constants from '../constants'
import { getTribeOwnersChatByUUID } from '../utils/tribes'

/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

export interface Action {
  action: string
  chat_uuid: string
  bot_id: string
  bot_name?: string
  amount?: number
  pubkey?: string
  content?: string
  route_hint?: string
}

export async function processAction(req, res) {
  console.log('=> processAction', req.body)
  let body = req.body
  if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
    try {
      // parse out body from "data" for github webhook action
      const dataBody = JSON.parse(body.data.replace(/'/g, '"'))
      if (dataBody) body = dataBody
    } catch (e) {
      console.log(e)
      return failure(res, 'failed to parse webhook body json')
    }
  }
  const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid } =
    body

  if (!bot_id) return failure(res, 'no bot_id')
  const bot = await models.Bot.findOne({ where: { id: bot_id } })
  if (!bot) return failure(res, 'no bot')

  if (!(bot.secret && bot.secret === bot_secret)) {
    return failure(res, 'wrong secret')
  }
  if (!action) {
    return failure(res, 'no action')
  }

  const a: Action = {
    bot_id,
    action,
    pubkey: pubkey || '',
    content: content || '',
    amount: amount || 0,
    bot_name: bot.name,
    chat_uuid: chat_uuid || '',
  }

  try {
    const r = await finalAction(a)
    success(res, r)
  } catch (e) {
    failure(res, e)
  }
}

export async function finalAction(a: Action) {
  const {
    bot_id,
    action,
    pubkey,
    route_hint,
    amount,
    content,
    bot_name,
    chat_uuid,
  } = a

  let myBot
  // not for tribe admin, for bot maker
  if (bot_id) {
    myBot = await models.Bot.findOne({
      where: {
        id: bot_id,
      },
    })
    if (chat_uuid) {
      const myChat = await getTribeOwnersChatByUUID(chat_uuid)
      // ACTUALLY ITS A LOCAL (FOR MY TRIBE) message! kill myBot
      if (myChat) myBot = null
    }
  }

  // console.log("=> ACTION HIT", a);
  if (myBot) {
    // IM NOT ADMIN - its my bot and i need to forward to admin - there is a chat_uuid
    const owner = await models.Contact.findOne({ where: { id: myBot.tenant } })
    // THIS is a bot member cmd res (i am bot maker)
    const botMember = await models.BotMember.findOne({
      where: {
        tribeUuid: chat_uuid,
        botId: bot_id,
        tenant: owner.id,
      },
    })
    if (!botMember) return console.log('no botMember')

    const dest = botMember.memberPubkey
    if (!dest) return console.log('no dest to send to')
    const topic = `${dest}/${myBot.uuid}`
    const data = <network.Msg>{
      action,
      bot_id,
      bot_name,
      type: constants.message_types.bot_res,
      message: { content: a.content, amount: amount || 0 },
      chat: { uuid: chat_uuid },
      sender: {
        pub_key: String(owner.publicKey),
        alias: bot_name,
        role: 0,
        route_hint,
      }, // for verify sig
    }
    try {
      await network.signAndSend({ dest, data, route_hint }, owner, topic)
    } catch (e) {
      console.log('=> couldnt mqtt publish')
    }
    return // done
  }

  if (action === 'keysend') {
    return console.log('=> BOT KEYSEND to', pubkey)
    // if (!(pubkey && pubkey.length === 66 && amount)) {
    //     throw 'wrong params'
    // }
    // const destkey = pubkey
    // const opts = {
    //     dest: destkey,
    //     data: {},
    //     amt: Math.max((amount || 0), constants.min_sat_amount)
    // }
    // try {
    //     await network.signAndSend(opts, ownerPubkey)
    //     return ({ success: true })
    // } catch (e) {
    //     throw e
    // }
  } else if (action === 'broadcast') {
    console.log('=> BOT BROADCAST')
    if (!content) return console.log('no content')
    if (!chat_uuid) return console.log('no chat_uuid')
    const theChat = await getTribeOwnersChatByUUID(chat_uuid)
    if (!(theChat && theChat.id)) return console.log('no chat')
    if (theChat.type !== constants.chat_types.tribe)
      return console.log('not a tribe')
    const owner = await models.Contact.findOne({
      where: { id: theChat.tenant },
    })
    const tenant: number = owner.id

    const encryptedForMeText = rsa.encrypt(owner.contactKey, content)
    const encryptedText = rsa.encrypt(theChat.groupKey, content)
    const textMap = { chat: encryptedText }
    var date = new Date()
    date.setMilliseconds(0)
    const alias = bot_name || 'Bot'
    const botContactId = -1

    const msg: { [k: string]: any } = {
      chatId: theChat.id,
      uuid: short.generate(),
      type: constants.message_types.bot_res,
      sender: botContactId,
      amount: amount || 0,
      date: date,
      messageContent: encryptedForMeText,
      remoteMessageContent: JSON.stringify(textMap),
      status: constants.statuses.confirmed,
      createdAt: date,
      updatedAt: date,
      senderAlias: alias,
      tenant,
    }
    const message = await models.Message.create(msg)
    socket.sendJson(
      {
        type: 'message',
        response: jsonUtils.messageToJson(message, theChat, owner),
      },
      tenant
    )
    // console.log("BOT BROADCASE SENDER", owner.dataValues)
    await network.sendMessage({
      chat: theChat,
      sender: {
        ...owner.dataValues,
        alias,
        id: botContactId,
        role: constants.chat_roles.reader,
      },
      message: { content: textMap, id: message.id, uuid: message.uuid },
      type: constants.message_types.bot_res,
      success: () => ({ success: true }),
      failure: (e) => {
        return console.log(e)
      },
      isForwarded: true,
    })
  } else {
    return console.log('no action')
  }
}
