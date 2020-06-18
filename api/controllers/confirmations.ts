import lock from '../utils/lock'
import {models} from '../models'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as network from '../network'
import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))

export function sendConfirmation({ chat, sender, msg_id }) {
	if(!msg_id) return
	network.sendMessage({
		chat,
		sender,
		message: {id:msg_id},
		type: constants.message_types.confirmation,
	})
}

export async function receiveConfirmation(payload) {
	console.log('=> received confirmation', (payload.message&&payload.message.id))

	const dat = payload.content || payload
	const chat_uuid = dat.chat.uuid
	const msg_id = dat.message.id
	const sender_pub_key = dat.sender.pub_key

	const owner = await models.Contact.findOne({ where: { isOwner: true }})
	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	
	// new confirmation logic
	if(msg_id){
		lock.acquire('confirmation', async function(done){
			console.log("update status map")
			const message = await models.Message.findOne({ where:{id:msg_id} })
			if(message){
				let statusMap = {}
				try{
					statusMap = JSON.parse(message.statusMap||'{}')
				} catch(e){}
				statusMap[sender.id] = constants.statuses.received

				await message.update({ 
					status: constants.statuses.received,
					statusMap: JSON.stringify(statusMap)
				})
				socket.sendJson({
					type: 'confirmation',
					response: jsonUtils.messageToJson(message, chat, sender)
				})
			}
			done()
		})
	} else { // old logic
		const messages = await models.Message.findAll({
			limit: 1,
			where: {
				chatId: chat.id,
				sender: owner.id,
				type: [
					constants.message_types.message,
					constants.message_types.invoice,
					constants.message_types.attachment,
				],
				status: constants.statuses.pending,
			},
			order: [['createdAt', 'desc']]
		})
	
		const message = messages[0]
		message.update({ status: constants.statuses.received })
	
		socket.sendJson({
			type: 'confirmation',
			response: jsonUtils.messageToJson(message, chat, sender)
		})
	}
}

export async function tribeOwnerAutoConfirmation(msg_id){
	const message = await models.Message.findOne({ where:{id:msg_id} })
	if(message){
		let statusMap = {}
		try{
			statusMap = JSON.parse(message.statusMap||'{}')
		} catch(e){}
		statusMap['chat'] = constants.statuses.received

		await message.update({ 
			status: constants.statuses.received,
			statusMap: JSON.stringify(statusMap)
		})
		socket.sendJson({
			type: 'confirmation',
			response: jsonUtils.messageToJson(message, null, null)
		})
	}
}
