import { models } from './models'
import * as md5 from 'md5'
import * as network from './network'

const constants = require('../config/constants.json');

const findOrCreateChat = async (params) => {
	const { chat_id, owner_id, recipient_id } = params
	let chat
	let date = new Date();
	date.setMilliseconds(0)

	if (chat_id) {
		chat = await models.Chat.findOne({ where: { id: chat_id } })
		// console.log('findOrCreateChat: chat_id exists')
	} else {
		console.log("chat does not exists, create new")
		const owner = await models.Contact.findOne({ where: { id: owner_id } })
		const recipient = await models.Contact.findOne({ where: { id: recipient_id } })
		const uuid = md5([owner.publicKey, recipient.publicKey].sort().join("-"))

		// find by uuid
		chat = await models.Chat.findOne({ where:{uuid} })
		
		if(!chat){ // no chat! create new
			chat = await models.Chat.create({
				uuid: uuid,
				contactIds: JSON.stringify([parseInt(owner_id), parseInt(recipient_id)]),
				createdAt: date,
				updatedAt: date,
				type: constants.chat_types.conversation
			})
		}
	}
	return chat
}

const sendContactKeys = async (args) => {
	const { type, contactIds, contactPubKey, sender, success, failure } = args
	const msg = newkeyexchangemsg(type, sender)

	let yes:any = null
	let no:any = null
	let cids = contactIds

	if(!contactIds) cids = [null] // nully
	await asyncForEach(cids, async contactId => {
		let destination_key:string
		if(!contactId){ // nully
			destination_key = contactPubKey
		} else {
			if (contactId == sender.id) {
				return
			}
			const contact = await models.Contact.findOne({ where: { id: contactId } })
			destination_key = contact.publicKey
		}
		performKeysendMessage({
			sender,
			destination_key,
			amount: 3,
			msg,
			success: (data) => {
				yes = data
			},
			failure: (error) => {
				no = error
			}
		})
	})
	if(no && failure){
		failure(no)
	}
	if(!no && yes && success){
		success(yes)
	}
}

const performKeysendMessage = async ({ destination_key, amount, msg, success, failure, sender }) => {
	const opts = {
		dest: destination_key,
		data: msg || {},
		amt: Math.max(amount, 3)
	}
	try {
		const r = await network.signAndSend(opts, sender.publicKey)
		console.log("=> external keysend")
		if (success) success(r)
	} catch (e) {
		console.log("MESSAGE ERROR", e)
		if (failure) failure(e)
	}
}

async function findOrCreateContactByPubkey(senderPubKey) {
	let sender = await models.Contact.findOne({ where: { publicKey: senderPubKey } })
	if (!sender) {
		sender = await models.Contact.create({
			publicKey: senderPubKey,
			alias: "Unknown",
			status: 1
		})

		const owner = await models.Contact.findOne({ where: { isOwner: true } })
		sendContactKeys({
			contactIds: [sender.id],
			sender: owner,
			type: constants.message_types.contact_key,
		})
	}
	return sender
}

async function findOrCreateChatByUUID(chat_uuid, contactIds) {
	let chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) {
		var date = new Date();
		date.setMilliseconds(0)
		chat = await models.Chat.create({
			uuid: chat_uuid,
			contactIds: JSON.stringify(contactIds || []),
			createdAt: date,
			updatedAt: date,
			type: 0 // conversation
		})
	}
	return chat
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function parseReceiveParams(payload) {
	const dat = payload.content || payload
	const sender_pub_key = dat.sender.pub_key
	const sender_alias = dat.sender.alias
	const chat_uuid = dat.chat.uuid
	const chat_type = dat.chat.type
	const chat_members: { [k: string]: any } = dat.chat.members || {}
	const chat_name = dat.chat.name
	const chat_key = dat.chat.groupKey
	const chat_host = dat.chat.host
	const amount = dat.message.amount
	const content = dat.message.content
	const mediaToken = dat.message.mediaToken
	const msg_id = dat.message.id||0
	const mediaKey = dat.message.mediaKey
	const mediaType = dat.message.mediaType
	const isTribeOwner = dat.isTribeOwner?true:false

	const isConversation = !chat_type || (chat_type && chat_type == constants.chat_types.conversation)
	let sender
	let chat
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	if (isConversation) {
		sender = await findOrCreateContactByPubkey(sender_pub_key)
		chat = await findOrCreateChatByUUID(
			chat_uuid, [parseInt(owner.id), parseInt(sender.id)]
		)
		if(sender.fromGroup) { // if a private msg received, update the contact
			await sender.update({fromGroup:false})
		}
	} else { // group
		sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
		// inject a "sender" with an alias
		if(!sender && chat_type == constants.chat_types.tribe){
			sender = {id:0, alias:sender_alias}
		}
		chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	}
	return { owner, sender, chat, sender_pub_key, sender_alias, isTribeOwner, chat_uuid, amount, content, mediaToken, mediaKey, mediaType, chat_type, msg_id, chat_members, chat_name, chat_host, chat_key }
}

export {
	findOrCreateChat,
	sendContactKeys,
	findOrCreateContactByPubkey,
	findOrCreateChatByUUID,
	sleep,
	parseReceiveParams,
	performKeysendMessage
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}

function newkeyexchangemsg(type, sender){
	return {
		type: type,
		sender: {
			// pub_key: sender.publicKey,
			contact_key: sender.contactKey,
			...sender.alias && {alias: sender.alias},
			// ...sender.photoUrl && {photoUrl: sender.photoUrl}
		}
	}
}