import { success, failure } from '../utils/res'
import * as path from 'path'
import * as fs from 'fs'
import * as network from '../network'
import { models } from '../models'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'

/*
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

const actionFile = '../../../actions.json'
const constants = require(path.join(__dirname,'../../config/constants.json'))

export async function doAction(req, res) {
    const thePath = path.join(__dirname,actionFile)
    try {
        if (fs.existsSync(thePath)) {
            processExtra(req, res)
        } else {
            failure(res, 'no file')
        }
    } catch(err) {
        console.error(err)
        failure(res, 'fail')
    }
}

async function processExtra(req, res) {
    const actions = require(path.join(__dirname,actionFile))
    if(!(actions&&actions.length)) {
        return failure(res, 'no actions defined')
    }
    const {action,app,secret,pubkey,amount,chat_uuid,text} = req.body
    
    const theApp = actions.find(a=>a.app===app)
    if(!theApp) {
        return failure(res, 'app not found')
    }
    if(!(theApp.secret&&theApp.secret===secret)) {
        return failure(res, 'wrong secret')
    }
    if(!action){
        return failure(res, 'no action')
    }

    if(action==='keysend') {
        if(!(pubkey&&pubkey.length===66&&amount)) {
            return failure(res, 'wrong params')
        }
        const MIN_SATS = 3
        const destkey = pubkey
        const opts = {
            dest: destkey,
            data: {},
            amt: Math.max((amount||0), MIN_SATS)
        }
        try {
            await network.signAndSend(opts)
            return success(res, {success:true})
        } catch(e) {
            return failure(res, e)
        }
    } else if (action==='broadcast') {
        if(!chat_uuid || !text) return failure(res,'no uuid or text')
        const owner = await models.Contact.findOne({ where: { isOwner: true } })
        const theChat = await models.Chat.findOne({where:{uuid: chat_uuid}})
        if(!theChat) return failure(res,'no chat')
        if(!theChat.type===constants.chat_types.tribe) return failure(res,'not a tribe')
        
        const encryptedForMeText = rsa.encrypt(owner.contactKey, text)
        const encryptedText = rsa.encrypt(theChat.groupKey, text)
        const textMap = {'chat': encryptedText}
        var date = new Date();
	    date.setMilliseconds(0)
        const msg:{[k:string]:any}={
            chatId: theChat.id,
            uuid: short.generate(),
            type: constants.message_types.message,
            sender: owner.id,
            amount: amount||0,
            date: date,
            messageContent: encryptedForMeText,
            remoteMessageContent: JSON.stringify(textMap),
            status: constants.statuses.confirmed,
            createdAt: date,
            updatedAt: date,
        }
        const message = await models.Message.create(msg)
        network.sendMessage({
            chat: theChat,
            sender: owner,
            message: { content:textMap, id:message.id, uuid: message.uuid },
            type: constants.message_types.message,
        })
    } else {
        return failure(res, 'no action')
    }
}