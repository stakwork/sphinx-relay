import * as network from '../network'
import { models } from '../models'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'
import * as jsonUtils from '../utils/json'
import * as socket from '../utils/socket'
import { success, failure } from '../utils/res'
import constants from '../constants'

/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

export interface Action {
    action: string
    chat_uuid: string
    bot_id: string,
    bot_name?: string
    amount?: number
    pubkey?: string
    content?: string
}

export async function processAction(req, res) {
    console.log('=> processAction', req.body)
    let body = req.body
    if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
        try { // parse out body from "data" for github webhook action
            const dataBody = JSON.parse(body.data.replace(/'/g, '"'))
            if (dataBody) body = dataBody
        } catch (e) {
            console.log(e)
            return failure(res, 'failed to parse webhook body json')
        }
    }
    const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid } = body
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
        const r = await finalAction(a, bot_id)
        success(res, r)
    } catch (e) {
        failure(res, e)
    }
}

export async function finalAction(a: Action, bot_id: string) {
    const { action, pubkey, amount, content, bot_name, chat_uuid } = a

    const owner = await models.Contact.findOne({ where: { isOwner: true } })

    let theChat
    if (chat_uuid) {
        theChat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
    }
    const iAmTribeAdmin = owner.publicKey === (theChat && theChat.ownerPubkey)
    console.log("=> ACTION HIT", a.action, a.bot_name)
    if (chat_uuid && !iAmTribeAdmin) { // IM NOT ADMIN - its my bot and i need to forward to admin - there is a chat_uuid
        const myBot = await models.Bot.findOne({
            where: {
                id: bot_id
            }
        })
        if (!myBot) return console.log('no bot')
        // THIS is a bot member cmd res (i am bot maker)
        const botMember = await models.BotMember.findOne({
            where: {
                tribeUuid: chat_uuid, botId: bot_id
            }
        })
        if (!botMember) return console.log('no botMember')

        const dest = botMember.memberPubkey
        if (!dest) return console.log('no dest to send to')
        const topic = `${dest}/${myBot.uuid}`
        const data = <network.Msg>{
            action, bot_id, bot_name,
            type: constants.message_types.bot_res,
            message: { content: a.content, amount: amount || 0 },
            chat: { uuid: chat_uuid },
            sender: {
                pub_key: String(owner.publicKey),
                alias: bot_name, role: 0
            }, // for verify sig
        }
        try {
            await network.signAndSend({ dest, data }, topic)
        } catch (e) {
            console.log('=> couldnt mqtt publish')
        }
        return
    }

    if (action === 'keysend') {
        console.log('=> BOT KEYSEND')
        if (!(pubkey && pubkey.length === 66 && amount)) {
            throw 'wrong params'
        }
        const destkey = pubkey
        const opts = {
            dest: destkey,
            data: {},
            amt: Math.max((amount || 0), constants.min_sat_amount)
        }
        try {
            await network.signAndSend(opts)
            return ({ success: true })
        } catch (e) {
            throw e
        }

    } else if (action === 'broadcast') {
        console.log('=> BOT BROADCAST')
        if (!content) throw 'no content'
        if (!theChat) throw 'no chat'
        if (theChat.type !== constants.chat_types.tribe) throw 'not a tribe'

        const encryptedForMeText = rsa.encrypt(owner.contactKey, content)
        const encryptedText = rsa.encrypt(theChat.groupKey, content)
        const textMap = { 'chat': encryptedText }
        var date = new Date();
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
        }
        const message = await models.Message.create(msg)
        socket.sendJson({
            type: 'message',
            response: jsonUtils.messageToJson(message, theChat, owner)
        })
        await network.sendMessage({
            chat: theChat,
            sender: { ...owner.dataValues, alias, id: botContactId, role: constants.chat_roles.reader },
            message: { content: textMap, id: message.id, uuid: message.uuid },
            type: constants.message_types.bot_res,
            success: () => ({ success: true }),
            failure: (e) => {
                throw e
            },
            isForwarded: true,
        })

    } else {
        throw 'no action'
    }
}