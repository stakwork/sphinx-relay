import { success, failure } from '../utils/res'
import * as path from 'path'
import * as network from '../network'
import { models } from '../models'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'
import * as crypto from 'crypto'
import * as jsonUtils from '../utils/json'
import * as tribes from '../utils/tribes'
import * as socket from '../utils/socket'

/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

const constants = require(path.join(__dirname, '../../config/constants.json'))

export const getBots = async (req, res) => {
    try {
        const bots = await models.Bot.findAll()
        success(res, {
            bots: bots.map(b=> jsonUtils.botToJson(b))
        })
    } catch(e) {
        failure(res,'no bots')
    }
}

export const getBotsForTribe = async (req, res) => {
    const chat_id = req.params.chat_id
    const chatId = parseInt(chat_id)
    if(!chatId) return failure(res,'no chat id')
    try {
        const bots = await models.Bot.findAll({where:{chatId}})
        success(res, {
            bots: bots.map(b=> jsonUtils.botToJson(b))
        })
    } catch(e) {
        failure(res,'no bots')
    }
}

export const createBot = async (req, res) => {
    const { chat_id, name, } = req.body
    const chatId = parseInt(chat_id)
    const chat = await models.Chat.findOne({where:{id:chatId}})
    if(!chat) return failure(res,'no chat')

    const owner = await models.Contact.findOne({where: {isOwner:true}})
    const isTribeOwner = owner.publicKey===chat.ownerPubkey
    if(!isTribeOwner) return failure(res, 'not tribe owner')

    const uuid = await tribes.genSignedTimestamp()
    const newBot = {
        uuid,
        id: crypto.randomBytes(16).toString('hex').toUpperCase(),
        chatId: chat_id,
        name: name,
        secret: crypto.randomBytes(16).toString('hex').toUpperCase()
    }
    try {
        const theBot = await models.Bot.create(newBot)
        success(res, jsonUtils.botToJson(theBot))
    } catch (e) {
        failure(res, 'bot creation failed')
    }
}

export const deleteBot = async (req, res) => {
    const id = req.params.id
    if (!id) return
    try {
        models.Bot.destroy({ where: { id } })
        success(res, true)
    } catch (e) {
        console.log('ERROR deleteBot', e)
        failure(res, e)
    }
}

export interface Action {
    action: string
    chatID: number,
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

    if (!(bot.secret && bot.secret === bot_secret)) {
        return failure(res, 'wrong secret')
    }
    if (!action) {
        return failure(res, 'no action')
    }

    const a:Action = {
        action, pubkey, text, amount,
        botName:bot.name, chatID: bot.chatId
    }

    try {
        const r = await finalActionProcess(a)
        success(res, r)
    } catch(e) {
        failure(res, e)
    }
    
}

export async function finalActionProcess(a:Action){
    const {action,pubkey,amount,text,botName,chatID} = a

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
        if (!chatID || !text) throw 'no chatID or text'
        const owner = await models.Contact.findOne({ where: { isOwner: true } })
        const theChat = await models.Chat.findOne({ where: { id: chatID } })
        if (!theChat || !owner) throw 'no chat'
        if (!theChat.type === constants.chat_types.tribe) throw 'not a tribe'

        const encryptedForMeText = rsa.encrypt(owner.contactKey, text)
        const encryptedText = rsa.encrypt(theChat.groupKey, text)
        const textMap = { 'chat': encryptedText }
        var date = new Date();
        date.setMilliseconds(0)
        const alias = botName || 'Bot'
        const msg: { [k: string]: any } = {
            chatId: theChat.id,
            uuid: short.generate(),
            type: constants.message_types.bot_res,
            sender: owner.id,
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
            sender: { ...owner.dataValues, alias },
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