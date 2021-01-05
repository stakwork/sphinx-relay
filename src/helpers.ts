import { models } from './models'
import * as md5 from 'md5'
import * as network from './network'
import constants from './constants'

export const findOrCreateChat = async (params) => {
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
		chat = await models.Chat.findOne({ where: { uuid } })

		if (!chat) { // no chat! create new
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

export const sendContactKeys = async ({ type, contactIds, sender, success, failure, dontActuallySendContactKey, contactPubKey }:{type:number,contactIds:number[],sender:any,success?:Function,failure?:Function,dontActuallySendContactKey?:boolean,contactPubKey?:string}) => {
	const msg = newkeyexchangemsg(type, sender, dontActuallySendContactKey||false)

	if(contactPubKey) { // dont use ids here
		performKeysendMessage({
			sender,
			destination_key: contactPubKey,
			amount: 3,
			msg,
			success,
			failure
		})
		return
	}

	let yes: any = null
	let no: any = null
	let cids = contactIds || []

	await asyncForEach(cids, async contactId => {
		let destination_key: string
		if (contactId == sender.id) {
			return
		}
		const contact = await models.Contact.findOne({ where: { id: contactId } })
		if(!(contact && contact.publicKey)) return
		destination_key = contact.publicKey

		console.log("=> KEY EXCHANGE", msg)
		await performKeysendMessage({
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
		await sleep(1000)
	})
	if (no && failure) {
		failure(no)
	}
	if (!no && yes && success) {
		success(yes)
	}
}

export const performKeysendMessage = async ({ destination_key, amount, msg, success, failure, sender }) => {
	const opts = {
		dest: destination_key,
		data: msg || {},
		amt: Math.max(amount, 3)
	}
	try {
		const r = await network.signAndSend(opts)
		// console.log("=> keysend to new contact")
		if (success) success(r)
	} catch (e) {
		console.log("MESSAGE ERROR to", destination_key, e)
		if (failure) failure(e)
	}
}

export async function findOrCreateContactByPubkey(senderPubKey) {
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

export async function findOrCreateChatByUUID(chat_uuid, contactIds) {
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

export async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export async function parseReceiveParams(payload) {
	const dat = payload.content || payload
	const sender_pub_key = dat.sender.pub_key
	const sender_alias = dat.sender.alias
	const sender_photo_url = dat.sender.photo_url || ''
	const chat_uuid = dat.chat.uuid
	const chat_type = dat.chat.type
	const chat_members: { [k: string]: any } = dat.chat.members || {}
	const chat_name = dat.chat.name
	const chat_key = dat.chat.groupKey
	const chat_host = dat.chat.host
	const amount = dat.message.amount
	const content = dat.message.content
	const remote_content = dat.message.remoteContent
	const message_status = dat.message.status
	const mediaToken = dat.message.mediaToken
	const originalMuid = dat.message.originalMuid
	const msg_id = dat.message.id || 0
	const msg_uuid = dat.message.uuid || ''
	const mediaKey = dat.message.mediaKey
	const mediaType = dat.message.mediaType
	const date_string = dat.message.date
	const skip_payment_processing = dat.message.skipPaymentProcessing
	const reply_uuid = dat.message.replyUuid
	const purchaser_id = dat.message.purchaser
	const network_type = dat.network_type || 0
	const isTribeOwner = dat.isTribeOwner ? true : false

	const isConversation = !chat_type || (chat_type && chat_type == constants.chat_types.conversation)
	let sender
	let chat
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	if (isConversation) {
		sender = await findOrCreateContactByPubkey(sender_pub_key)
		chat = await findOrCreateChatByUUID(
			chat_uuid, [parseInt(owner.id), parseInt(sender.id)]
		)
		if (sender.fromGroup) { // if a private msg received, update the contact
			await sender.update({ fromGroup: false })
		}
	} else { // group
		sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
		// inject a "sender" with an alias
		if (!sender && chat_type == constants.chat_types.tribe) {
			sender = { id: 0, alias: sender_alias }
		}
		chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	}
	return { owner, sender, chat, sender_pub_key, sender_alias, isTribeOwner, chat_uuid, amount, content, mediaToken, mediaKey, mediaType, originalMuid, chat_type, msg_id, chat_members, chat_name, chat_host, chat_key, remote_content, msg_uuid, date_string, reply_uuid, skip_payment_processing, purchaser_id, sender_photo_url, network_type, message_status }
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

function newkeyexchangemsg(type, sender, dontActuallySendContactKey) {
	const includePhotoUrl = sender && sender.photoUrl && !sender.privatePhoto
	return {
		type: type,
		sender: {
			pub_key: sender.publicKey,
			...!dontActuallySendContactKey && {contact_key: sender.contactKey},
			...sender.alias && { alias: sender.alias },
			...includePhotoUrl && { photo_url: sender.photoUrl }
		}
	}
}
