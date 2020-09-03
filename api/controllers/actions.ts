import * as path from 'path'
import * as network from '../network'
import { models } from '../models'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'
import * as jsonUtils from '../utils/json'
import * as socket from '../utils/socket'
import { success, failure } from '../utils/res'

/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

const constants = require(path.join(__dirname, '../../config/constants.json'))

export interface Action {
    action: string
    chatUUID: string
    botName?: string
    amount?: number
    pubkey?: string
    text?: string
}

export async function processAction(req, res) {
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
    const { action, bot_id, bot_secret, pubkey, amount, text } = body
    const bot = await models.Bot.findOne({ where: { id: bot_id } })
    if (!bot) return failure(res, 'no bot')

    const chat = await models.Chat.findOne({ where:{id:bot.chatId} })

    if (!(bot.secret && bot.secret === bot_secret)) {
        return failure(res, 'wrong secret')
    }
    if (!action) {
        return failure(res, 'no action')
    }

    const a:Action = {
        action, pubkey, text, amount,
        botName:bot.name, chatUUID: chat.uuid
    }

    try {
        const r = await finalAction(a)
        success(res, r)
    } catch(e) {
        failure(res, e)
    }
}

export async function finalAction(a:Action){
    const {action,pubkey,amount,text,botName,chatUUID} = a

    if (action === 'keysend') {
        console.log('=> BOT KEYSEND')
        if (!(pubkey && pubkey.length === 66 && amount)) {
            throw 'wrong params'
        }
        const MIN_SATS = 3
        const destkey = pubkey
        const opts = {
            dest: destkey,
            data: {},
            amt: Math.max((amount || 0), MIN_SATS)
        }
        try {
            await network.signAndSend(opts)
            return ({ success: true })
        } catch (e) {
            throw e
        }

    } else if (action === 'broadcast') {
        console.log('=> BOT BROADCAST')
        if (!chatUUID || !text) throw 'no chatID or text'
        const owner = await models.Contact.findOne({ where: { isOwner: true } })
        const theChat = await models.Chat.findOne({ where: { uuid: chatUUID } })
        if (!theChat || !owner) throw 'no chat'
        if (!theChat.type === constants.chat_types.tribe) throw 'not a tribe'

        const encryptedForMeText = rsa.encrypt(owner.contactKey, text)
        const encryptedText = rsa.encrypt(theChat.groupKey, text)
        const textMap = { 'chat': encryptedText }
        var date = new Date();
        date.setMilliseconds(0)
        const alias = botName || 'Bot'
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
            sender: { ...owner.dataValues, alias, id:botContactId },
            message: { content: textMap, id: message.id, uuid: message.uuid },
            type: constants.message_types.message,
            success: () => ({ success: true }),
            failure: (e) => {
                throw e
            }
        })

    } else {
        throw 'no action'
    }
}