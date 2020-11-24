import {models} from '../models'
import { Op } from 'sequelize' 
import { indexBy } from 'underscore'
import { sendNotification } from '../hub'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import { failure, success } from '../utils/res'
import * as timers from '../utils/timers'
import {sendConfirmation} from './confirmations'
import * as network from '../network'
import * as short from 'short-uuid'
import constants from '../constants'

export const getMessages = async (req, res) => {
	const dateToReturn = req.query.date;

	if (!dateToReturn) {
		return getAllMessages(req, res)
	}
	console.log(dateToReturn)
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	// const chatId = req.query.chat_id

	let newMessagesWhere = {
		date: { [Op.gte]: dateToReturn },
		[Op.or]: [
			{receiver: owner.id}, 
			{receiver: null}
		]
	}
	
	let confirmedMessagesWhere = {
		updated_at: { [Op.gte]: dateToReturn },
		status: {[Op.or]: [
			constants.statuses.received,
		]},
		sender: owner.id
	}

	let deletedMessagesWhere = {
		updated_at: { [Op.gte]: dateToReturn },
		status: {[Op.or]: [
			constants.statuses.deleted
		]},
	}

	// if (chatId) {
	// 	newMessagesWhere.chat_id = chatId
	// 	confirmedMessagesWhere.chat_id = chatId
	// }

	const newMessages = await models.Message.findAll({ where: newMessagesWhere })
	const confirmedMessages = await models.Message.findAll({ where: confirmedMessagesWhere })
	const deletedMessages = await models.Message.findAll({ where: deletedMessagesWhere })

	const chatIds: number[] = []
	newMessages.forEach(m => {
		if(!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
	})
	confirmedMessages.forEach(m => {
		if(!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
	})
	deletedMessages.forEach(m => {
		if(!chatIds.includes(m.chatId)) chatIds.push(m.chatId)
	})

	let chats = chatIds.length > 0 ? await models.Chat.findAll({ where: {deleted:false, id: chatIds} }) : []
	const chatsById = indexBy(chats, 'id')

	res.json({
		success: true,
		response: {
			new_messages: newMessages.map(message => 
				jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])
			),
			confirmed_messages: confirmedMessages.map(message => 
				jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])
			),
			deleted_messages: deletedMessages.map(message => 
				jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])
			)
		}
	});
	res.status(200)
	res.end()
}

export const getAllMessages = async (req, res) => {
	const limit = (req.query.limit && parseInt(req.query.limit)) || 1000
	const offset = (req.query.offset && parseInt(req.query.offset)) || 0
	console.log(`=> getAllMessages, limit: ${limit}, offset: ${offset}`)

	const messages = await models.Message.findAll({ order: [['id', 'asc']], limit, offset })
	console.log('=> got msgs',(messages&&messages.length))
	const chatIds:number[] = []
	messages.forEach((m) => {
		if(m.chatId && !chatIds.includes(m.chatId)) {
			chatIds.push(m.chatId)
		}
	})
	
	let chats = chatIds.length > 0 ? await models.Chat.findAll({ where: {deleted:false, id: chatIds} }) : []
	console.log('=> found all chats',(chats&&chats.length))
	const chatsById = indexBy(chats, 'id')
	console.log('=> indexed chats')
	success(res, {
		new_messages: messages.map(
			message => jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])
		),
		confirmed_messages: []
	})
};

export async function deleteMessage(req, res){
	const id = parseInt(req.params.id)

	const message = await models.Message.findOne({where:{id}})
	const uuid = message.uuid
	await message.update({status: constants.statuses.deleted})

	const chat_id = message.chatId
	let chat
	if(chat_id) {
		chat = await models.Chat.findOne({where:{id:chat_id}})
	}
	success(res, jsonUtils.messageToJson(message, chat))

	if(!chat) return
	const isTribe = chat.type===constants.chat_types.tribe

	const owner = await models.Contact.findOne({ where: { isOwner: true }})
	const isTribeOwner = isTribe && owner.publicKey===chat.ownerPubkey

	if(isTribeOwner) {
		timers.removeTimerByMsgId(id)
	}
	network.sendMessage({
		chat: chat,
		sender: owner,
		type: constants.message_types.delete,
		message: {id,uuid},
	})
}

export const sendMessage = async (req, res) => {
	// try {
	// 	schemas.message.validateSync(req.body)
	// } catch(e) {
	// 	return failure(res, e.message)
	// }
	const {
		contact_id,
		text,
		remote_text,
		chat_id,
		remote_text_map,
		amount,
		reply_uuid,
		boost,
	} = req.body

	let msgtype = constants.message_types.message
	if(boost) msgtype = constants.message_types.boost

	var date = new Date()
	date.setMilliseconds(0)

  	const owner = await models.Contact.findOne({ where: { isOwner: true }})
  	const chat = await helpers.findOrCreateChat({
		chat_id,
		owner_id: owner.id,
		recipient_id: contact_id,
	})

	let realSatsContactId
	// IF BOOST NEED TO SEND ACTUAL SATS TO OG POSTER
	const isTribe = chat.type===constants.chat_types.tribe
	if(reply_uuid && boost && amount) {
		const ogMsg = await models.Message.findOne({where:{
			uuid: reply_uuid,
		}})
		if(ogMsg && ogMsg.sender) {
			realSatsContactId = ogMsg.sender
		}	
	}

	const hasRealAmount = amount && amount>constants.min_sat_amount

	const remoteMessageContent = remote_text_map?JSON.stringify(remote_text_map) : remote_text
	const uuid = short.generate()
	const msg:{[k:string]:any}={
		chatId: chat.id,
		uuid: uuid,
		type: msgtype,
		sender: owner.id,
		amount: amount||0,
		date: date,
		messageContent: text,
		remoteMessageContent,
		status: constants.statuses.pending,
		createdAt: date,
		updatedAt: date,
		network_type: (!isTribe || hasRealAmount || realSatsContactId) ? 
			constants.network_types.lightning :
			constants.network_types.mqtt
	}
	if(reply_uuid) msg.replyUuid=reply_uuid
	// console.log(msg)
	const message = await models.Message.create(msg)

	success(res, jsonUtils.messageToJson(message, chat))

	const msgToSend:{[k:string]:any} = {
		id: message.id,
		uuid: message.uuid,
		content: remote_text_map || remote_text || text
	}
	if(reply_uuid) msgToSend.replyUuid=reply_uuid

	const sendMessageParams:{[k:string]:any} = {
		chat: chat,
		sender: owner,
		amount: amount||0,
		type: msgtype,
		message: msgToSend,
	}
	if(realSatsContactId) sendMessageParams.realSatsContactId = realSatsContactId

	// final send
	network.sendMessage(sendMessageParams)
}

export const receiveMessage = async (payload) => {
	// console.log('received message', { payload })

	const {owner, sender, chat, content, remote_content, msg_id, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, amount, network_type} = await helpers.parseReceiveParams(payload)
	if(!owner || !sender || !chat) {
		return console.log('=> no group chat!')
	}
	const text = content||''

	var date = new Date();
	date.setMilliseconds(0)
	if(date_string) date=new Date(date_string)

	const msg:{[k:string]:any} = {
		chatId: chat.id,
		uuid: msg_uuid,
		type: constants.message_types.message,
		sender: sender.id,
		date: date,
		amount: amount||0,
		messageContent: text,
		createdAt: date,
		updatedAt: date,
		status: constants.statuses.received,
		network_type: network_type,
	}
	const isTribe = chat_type===constants.chat_types.tribe
	if(isTribe) {
		msg.senderAlias = sender_alias
		if(remote_content) msg.remoteMessageContent=remote_content
	}
	if(reply_uuid) msg.replyUuid = reply_uuid
	const message = await models.Message.create(msg)

	socket.sendJson({
		type: 'message',
		response: jsonUtils.messageToJson(message, chat, sender)
	})

	sendNotification(chat, msg.senderAlias||sender.alias, 'message')

	const theChat = {...chat.dataValues, contactIds:[sender.id]}
	sendConfirmation({ chat:theChat, sender: owner, msg_id })
}

export const receiveBoost = async (payload) => {
	const {owner, sender, chat, content, remote_content, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, amount, network_type} = await helpers.parseReceiveParams(payload)
	console.log('received boost ' +amount+ ' sats on network:', network_type)
	if(!owner || !sender || !chat) {
		return console.log('=> no group chat!')
	}
	const text = content

	var date = new Date();
	date.setMilliseconds(0)
	if(date_string) date=new Date(date_string)

	const msg:{[k:string]:any} = {
		chatId: chat.id,
		uuid: msg_uuid,
		type: constants.message_types.boost,
		sender: sender.id,
		date: date,
		amount: amount||0,
		messageContent: text,
		createdAt: date,
		updatedAt: date,
		status: constants.statuses.received,
		network_type
	}
	const isTribe = chat_type===constants.chat_types.tribe
	if(isTribe) {
		msg.senderAlias = sender_alias
		if(remote_content) msg.remoteMessageContent=remote_content
	}
	if(reply_uuid) msg.replyUuid = reply_uuid
	const message = await models.Message.create(msg)

	socket.sendJson({
		type: 'boost',
		response: jsonUtils.messageToJson(message, chat, sender)
	})
}

export const receiveDeleteMessage = async (payload) => {
	console.log('=> received delete message')
	const {owner, sender, chat, chat_type, msg_uuid} = await helpers.parseReceiveParams(payload)
	if(!owner || !sender || !chat) {
		return console.log('=> no group chat!')
	}

	const isTribe = chat_type===constants.chat_types.tribe
	// in tribe this is already validated on admin's node
	let where:{[k:string]:any} = {uuid: msg_uuid}
	if(!isTribe) {
		where.sender = sender.id // validate sender
	}
	const message = await models.Message.findOne({where})
	if(!message) return

	await message.update({status: constants.statuses.deleted})
	socket.sendJson({
		type: 'delete',
		response: jsonUtils.messageToJson(message, chat, sender)
	})
}

export const readMessages = async (req, res) => {
	const chat_id = req.params.chat_id;
	
	const owner = await models.Contact.findOne({ where: { isOwner: true }})

	await models.Message.update({ seen: true }, {
		where: {
		  sender: {
			[Op.ne]: owner.id
		  },
		  chatId: chat_id
		}
	});
	const chat = await models.Chat.findOne({ where: { id: chat_id } })
	if(chat) {
		await chat.update({ seen: true });
		success(res, {})
		sendNotification(chat, '', 'badge')
		socket.sendJson({
			type: 'chat_seen',
			response: jsonUtils.chatToJson(chat)
		})
	} else {
		failure(res, 'no chat')
	}
}

export const clearMessages = (req, res) => {
	models.Message.destroy({ where: {}, truncate: true })

	success(res, {})
}
