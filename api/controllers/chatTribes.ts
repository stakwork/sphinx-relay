import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import * as rsa from '../crypto/rsa'
import * as helpers from '../helpers'
import * as socket from '../utils/socket'
import * as tribes from '../utils/tribes'
import * as path from 'path'
import { sendNotification } from '../hub'
import {personalizeMessage, decryptMessage} from '../utils/msg'
import { Op } from 'sequelize'

const constants = require(path.join(__dirname,'../../config/constants.json'))

export async function joinTribe(req, res){
	console.log('=> joinTribe')
	const { uuid, group_key, name, host, amount, img, owner_pubkey, owner_alias } = req.body
	const is_private = req.body.private

	const existing = await models.Chat.findOne({where:{uuid}})
	if(existing) {
		console.log('[tribes] u are already in this tribe')
		return failure(res, 'cant find tribe')
	}

	if(!owner_pubkey || !group_key || !uuid) {
		console.log('[tribes] missing required params')
		return failure(res, 'missing required params')
	}

	const ownerPubKey = owner_pubkey
	// verify signature here?

	const tribeOwner = await models.Contact.findOne({ where: { publicKey: ownerPubKey } })

	let theTribeOwner
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	
	const contactIds = [owner.id]
	if (tribeOwner) {
		theTribeOwner = tribeOwner // might already include??
		if(!contactIds.includes(tribeOwner.id)) contactIds.push(tribeOwner.id)
	} else {
		const createdContact = await models.Contact.create({
			publicKey: ownerPubKey,
			contactKey: '',
			alias: owner_alias||'Unknown',
			status: 1,
			fromGroup: true,
		})
		theTribeOwner = createdContact
		contactIds.push(createdContact.id)
	}
	let date = new Date()
	date.setMilliseconds(0)

	const chatStatus = is_private ?
		constants.chat_statuses.pending :
		constants.chat_statuses.approved
	const chatParams = {
		uuid: uuid,
		contactIds: JSON.stringify(contactIds),
		photoUrl: img||'',
		createdAt: date,
		updatedAt: date,
		name: name,
		type: constants.chat_types.tribe,
		host: host || tribes.getHost(),
		groupKey: group_key,
		ownerPubkey: owner_pubkey,
		private: is_private||false,
		status: chatStatus,
		priceToJoin: amount||0,
	}
	
	const typeToSend = is_private ?
		constants.message_types.member_request :
		constants.message_types.group_join
	const contactIdsToSend = is_private ?
		[theTribeOwner.id] : // ONLY SEND TO TRIBE OWNER IF ITS A REQUEST
		chatParams.contactIds
	console.log('=> joinTribe: typeToSend', typeToSend)
	console.log('=> joinTribe: contactIdsToSend', contactIdsToSend)
	network.sendMessage({ // send my data to tribe owner
		chat: {
			...chatParams, 
			contactIds: contactIdsToSend, 
			members: {
				[owner.publicKey]: {
					key: owner.contactKey,
					alias: owner.alias||''
				}
			}
		},
		amount:amount||0,
		sender: owner,
		message: {},
		type: typeToSend,
		failure: function (e) {
			failure(res, e)
		},
		success: async function () {
			const chat = await models.Chat.create(chatParams)
			models.ChatMember.create({
				contactId: theTribeOwner.id,
				chatId: chat.id,
				role: constants.chat_roles.owner,
				lastActive: date,
				status: constants.chat_statuses.approved
			})
			success(res, jsonUtils.chatToJson(chat))
		}
	})
}

export async function receiveMemberRequest(payload) {
	console.log('=> receiveMemberRequest')
	const { sender_pub_key, sender_alias, chat_uuid, chat_members, chat_type, isTribeOwner } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return console.log('no chat')

	const isTribe = chat_type===constants.chat_types.tribe
	if(!isTribe || !isTribeOwner) return console.log('not a tribe')

	var date = new Date()
	date.setMilliseconds(0)
	
	let theSender: any = null
	const member = chat_members[sender_pub_key]
	const senderAlias = sender_alias || (member && member.alias) || 'Unknown'
	
	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
	if (sender) {
		theSender = sender // might already include??
	} else {
		if(member && member.key) {
			const createdContact = await models.Contact.create({
				publicKey: sender_pub_key,
				contactKey: member.key,
				alias: senderAlias,
				status: 1,
				fromGroup: true,
			})
			theSender = createdContact
		}
	}
	if(!theSender) return console.log('no sender') // fail (no contact key?)

	models.ChatMember.create({
		contactId: theSender.id,
		chatId: chat.id,
		role: constants.chat_roles.reader,
		status: constants.chat_statuses.pending,
		lastActive: date,
	})

	const msg:{[k:string]:any} = {
		chatId: chat.id,
		type: constants.message_types.member_request,
		sender: (theSender && theSender.id) || 0,
		messageContent:'', remoteMessageContent:'',
		status: constants.statuses.confirmed,
		date: date, createdAt: date, updatedAt: date
	}
	if(isTribe) {
		msg.senderAlias = sender_alias
	}
	const message = await models.Message.create(msg)

	const theChat = await addPendingContactIdsToChat(chat)
	socket.sendJson({
		type: 'member_request',
		response: {
			contact: jsonUtils.contactToJson(theSender||{}),
			chat: jsonUtils.chatToJson(theChat),
			message: jsonUtils.messageToJson(message, null)
		}
	})
}

export async function editTribe(req, res) {
	const {
		name,
		price_per_message,
		price_to_join,
		escrow_amount,
		escrow_millis,
		img,
		description,
		tags,
		unlisted,
	} = req.body
	const { id } = req.params

	if(!id) return failure(res, 'group id is required')

	const chat = await models.Chat.findOne({where:{id}})
	if(!chat) {
		return failure(res, 'cant find chat')
	}

	const owner = await models.Contact.findOne({ where: { isOwner: true } })

	let okToUpdate = true
	try{
		await tribes.edit({
			uuid: chat.uuid,
			name: name,
			host: chat.host,
			price_per_message: price_per_message||0,
			price_to_join: price_to_join||0,
			escrow_amount: escrow_amount||0,
			escrow_millis: escrow_millis||0,
			description, 
			tags, 
			img,
			owner_alias: owner.alias,
			unlisted,
			is_private: req.body.private
		})
	} catch(e) {
		okToUpdate = false
	}

	if(okToUpdate) {
		await chat.update({
			photoUrl: img||'',
			name: name,
			pricePerMessage: price_per_message||0,
			priceToJoin: price_to_join||0,
			escrowAmount: escrow_amount||0,
			escrowMillis: escrow_millis||0,
			unlisted: unlisted||false,
			private: req.body.private||false,
		})
		success(res, jsonUtils.chatToJson(chat))
	} else {
		failure(res, 'failed to update tribe')
	}
}

export async function approveOrRejectMember(req,res) {
	console.log('=> approve or reject tribe member')
	const chatId = parseInt(req.params['chatId'])
	const contactId = parseInt(req.params['contactId'])
	const status = req.params['status']

	if(!chatId || !contactId || !(status==='approved'||status==='rejected')) {
		return failure(res, 'incorrect status')
	}
	const chat = await models.Chat.findOne({ where: { id:chatId } })
	if (!chat) return

	let memberStatus = constants.chat_statuses.rejected
	let msgType = 'member_reject'
	if(status==='approved') {
		memberStatus = constants.chat_statuses.approved
		msgType = 'member_approve'
		const contactIds = JSON.parse(chat.contactIds || '[]')
		if(!contactIds.includes(contactId)) contactIds.push(contactId)
		await chat.update({ contactIds: JSON.stringify(contactIds) })
	}

	const member = await models.ChatMember.findOne({where:{contactId, chatId}})
	if(!member) {
		return failure(res, 'cant find chat member')
	}
	// update ChatMember status
	await member.update({status:memberStatus})

	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	const chatToSend = chat.dataValues||chat

	network.sendMessage({ // send to the requester
		chat: { ...chatToSend, contactIds: [member.contactId], },
		amount: 0,
		sender: owner,
		message: {},
		type: constants.message_types[msgType],
	})

	const theChat = await addPendingContactIdsToChat(chat)
	success(res, jsonUtils.chatToJson(theChat))
}

export async function receiveMemberApprove(payload) {
	console.log('=> receiveMemberApprove')
	const { owner, chat, chat_name, sender } = await helpers.parseReceiveParams(payload)
	if(!chat) return console.log('no chat')
	await chat.update({status: constants.chat_statuses.approved})

	let date = new Date()
	date.setMilliseconds(0)
	const msg:{[k:string]:any} = {
		chatId: chat.id,
		type: constants.message_types.member_approve,
		sender: (sender && sender.id) || 0,
		messageContent:'', remoteMessageContent:'',
		status: constants.statuses.confirmed,
		date: date, createdAt: date, updatedAt: date
	}
	const message = await models.Message.create(msg)
	socket.sendJson({
		type: 'member_approve',
		response: {
			message: jsonUtils.messageToJson(message, null),
			chat: jsonUtils.chatToJson(chat),
		}
	})

	const amount = chat.priceToJoin||0
	const theChat = chat.dataValues||chat
	// send JOIN and my info to all 
	network.sendMessage({
		chat: { ...theChat, 
			members: {
				[owner.publicKey]: {
					key: owner.contactKey,
					alias: owner.alias||''
				}
			}
		},
		amount,
		sender: owner,
		message: {},
		type: constants.message_types.group_join,
	})

	sendNotification(chat, chat_name, 'group')
}

export async function receiveMemberReject(payload) {
	console.log('=> receiveMemberReject')
	const { chat, sender, chat_name } = await helpers.parseReceiveParams(payload)
	if(!chat) return console.log('no chat')
	await chat.update({status: constants.chat_statuses.rejected})
	// dang.. nothing really to do here?
	let date = new Date()
	date.setMilliseconds(0)
	const msg:{[k:string]:any} = {
		chatId: chat.id,
		type: constants.message_types.member_reject,
		sender: (sender && sender.id) || 0,
		messageContent:'', remoteMessageContent:'',
		status: constants.statuses.confirmed,
		date: date, createdAt: date, updatedAt: date
	}
	const message = await models.Message.create(msg)
	socket.sendJson({
		type: 'member_reject',
		response: {
			message: jsonUtils.messageToJson(message, null),
			chat: jsonUtils.chatToJson(chat),
		}
	})

	sendNotification(chat, chat_name, 'reject')
}

export async function replayChatHistory(chat, contact) {
	if(!(chat&&chat.id&&contact&&contact.id)){
		return console.log('[tribes] cant replay history')
	}
	const msgs = await models.Message.findAll({ 
		where:{chatId:chat.id, type:{[Op.in]:network.typesToReplay}}, 
		order: [['id', 'desc']], 
		limit: 40
	})
	msgs.reverse()
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	asyncForEach(msgs, async m=>{
		if(!network.typesToReplay.includes(m.type)) return // only for message for now
		const sender = {
			...owner.dataValues,
			...m.senderAlias && {alias: m.senderAlias},
		}
		let content = ''
		try {content = JSON.parse(m.remoteMessageContent)} catch(e) {}

		const dateString = m.date&&m.date.toISOString()
		let mediaKeyMap
		let newMediaTerms
		if(m.type===constants.message_types.attachment) {
			if(m.mediaKey&&m.mediaToken) {
				const muid = m.mediaToken.split('.').length && m.mediaToken.split('.')[1]
				if(muid) {
					const mediaKey = await models.MediaKey.findOne({where:{
						muid, chatId: chat.id,
					}})
					// console.log("FOUND MEDIA KEY!!",mediaKey.dataValues)
					mediaKeyMap = {chat: mediaKey.key}
					newMediaTerms = {muid: mediaKey.muid}
				}
			}
		}
		let msg = network.newmsg(m.type, chat, sender, {
			content, // replaced with the remoteMessageContent (u are owner) {}
			...mediaKeyMap && {mediaKey: mediaKeyMap},
			...newMediaTerms && {mediaToken: newMediaTerms},
			...m.mediaType && {mediaType: m.mediaType},
			...dateString && {date: dateString}
		})
		msg = await decryptMessage(msg, chat)
		const data = await personalizeMessage(msg, contact, true)
		const mqttTopic = `${contact.publicKey}/${chat.uuid}`
		const replayingHistory = true
		await network.signAndSend({
			data,
			dest: contact.publicKey,
		}, mqttTopic, replayingHistory)
	})
}

export async function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join, escrow_amount, escrow_millis, unlisted, is_private): Promise<{[k:string]:any}> {
	let date = new Date()
	date.setMilliseconds(0)
	if (!(owner && contactIds && Array.isArray(contactIds))) {
		return {}
	}

	// make ts sig here w LNd pubkey - that is UUID
	const keys:{[k:string]:string} = await rsa.genKeys()
	const groupUUID = await tribes.genSignedTimestamp()
	const theContactIds = contactIds.includes(owner.id) ? contactIds : [owner.id].concat(contactIds)
	return {
		uuid: groupUUID,
		ownerPubkey: owner.publicKey,
		contactIds: JSON.stringify(theContactIds),
		createdAt: date,
		updatedAt: date,
		photoUrl: img||'',
		name: name,
		type: constants.chat_types.tribe,
		groupKey: keys.public,
		groupPrivateKey: keys.private,
		host: tribes.getHost(),
		pricePerMessage: price_per_message||0,
		priceToJoin: price_to_join||0,
		escrowMillis: escrow_millis||0,
		escrowAmount: escrow_amount||0,
		unlisted: unlisted||false,
		private: is_private||false,
	}
}

export async function addPendingContactIdsToChat(achat){
	const members = await models.ChatMember.findAll({where:{
		chatId: achat.id,
		status: constants.chat_statuses.pending // only pending
	}})
	if (!members) return achat
	const pendingContactIds:number[] = members.map(m=>m.contactId)
	const chat = achat.dataValues||achat
	return {
		...chat,
		pendingContactIds,
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}


