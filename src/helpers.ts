import { models, Contact } from './models'
import * as md5 from 'md5'
import * as network from './network'
import constants from './constants'
import { logging } from './utils/logger'

export const findOrCreateChat = async (params) => {
	const { chat_id, owner_id, recipient_id } = params
	// console.log("chat_id, owner_id, recipient_id", chat_id, owner_id, recipient_id)
	let chat
	let date = new Date();
	date.setMilliseconds(0)
	// console.log("findOrCreateChat", chat_id, typeof chat_id, owner_id, typeof owner_id)
	if (chat_id) {
		chat = await models.Chat.findOne({ where: { id: chat_id, tenant:owner_id } })
		// console.log('findOrCreateChat: chat_id exists')
	} else {
		console.log("chat does not exists, create new")
		const owner = await models.Contact.findOne({ where: { id: owner_id } })
		const recipient = await models.Contact.findOne({ where: { id: recipient_id, tenant:owner_id } })
		const uuid = md5([owner.publicKey, recipient.publicKey].sort().join("-"))

		// find by uuid
		chat = await models.Chat.findOne({ where: { uuid, tenant:owner_id } })

		if (!chat) { // no chat! create new
			console.log("=> no chat! create new")
			chat = await models.Chat.create({
				uuid: uuid,
				contactIds: JSON.stringify([parseInt(owner_id), parseInt(recipient_id)]),
				createdAt: date,
				updatedAt: date,
				type: constants.chat_types.conversation,
				tenant: owner_id,
			})
		}
	}
	return chat
}

export const sendContactKeys = async ({ type, contactIds, sender, success, failure, dontActuallySendContactKey, contactPubKey, routeHint }:{type:number,contactIds:number[],sender:any,success?:Function,failure?:Function,dontActuallySendContactKey?:boolean,contactPubKey?:string,routeHint?:string}) => {
	const msg = newkeyexchangemsg(type, sender, dontActuallySendContactKey||false)

	if(contactPubKey) { // dont use ids here
		performKeysendMessage({
			sender,
			destination_key: contactPubKey,
			amount: 3,
			msg,
			route_hint: routeHint,
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
		const route_hint = contact.routeHint

		// console.log("=> KEY EXCHANGE", msg)
		// console.log("=> TO", destination_key, route_hint)
		await performKeysendMessage({
			sender,
			destination_key,
			amount: 3,
			msg,
			route_hint,
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

export const performKeysendMessage = async ({ destination_key, route_hint, amount, msg, success, failure, sender }) => {
	const opts = {
		dest: destination_key,
		data: msg || {},
		amt: Math.max(amount, 3),
		route_hint
	}
	try {
		const r = await network.signAndSend(opts, sender)
		// console.log("=> keysend to new contact")
		if (success) success(r)
	} catch (e) {
		if(logging.Network) {
			console.log("KEYSEND MESSAGE ERROR to", destination_key, e, opts)
		}
		if (failure) failure(e)
	}
}

export async function findOrCreateContactByPubkeyAndRouteHint(senderPubKey:string, senderRouteHint:string, senderAlias:string, owner:Contact, realAmount:number) {
	let sender = await models.Contact.findOne({ where: { publicKey: senderPubKey, tenant:owner.id } })
	if (!sender) {
		let unmet = false
		if(owner.priceToMeet) {
			if(realAmount<owner.priceToMeet) unmet=true
		}
		sender = await models.Contact.create({
			publicKey: senderPubKey,
			routeHint: senderRouteHint||'',
			alias: senderAlias||"Unknown",
			status: 1,
			tenant: owner.id,
			unmet
		})
		sendContactKeys({
			contactIds: [sender.id],
			sender: owner,
			type: constants.message_types.contact_key,
		})
	}
	return sender
}

export async function findOrCreateChatByUUID(chat_uuid, contactIds, tenant) {
	let chat = await models.Chat.findOne({ where: { uuid: chat_uuid, tenant } })
	if (!chat) {
		var date = new Date();
		date.setMilliseconds(0)
		chat = await models.Chat.create({
			uuid: chat_uuid,
			contactIds: JSON.stringify(contactIds || []),
			createdAt: date,
			updatedAt: date,
			type: 0, // conversation
			tenant
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
	const sender_route_hint = dat.sender.route_hint
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
	const dest = dat.dest

	const isConversation = !chat_type || (chat_type && chat_type == constants.chat_types.conversation)
	let sender
	let chat
	let owner = dat.owner
	if(!owner) {
		const ownerRecord = await models.Contact.findOne({ where: { isOwner: true, publicKey:dest } })
		owner = ownerRecord.dataValues
	}
	if(!owner) console.log('=> parseReceiveParams cannot find owner')
	if (isConversation) {
		const realAmount = network_type===constants.network_types.lightning ? amount : 0
		sender = await findOrCreateContactByPubkeyAndRouteHint(sender_pub_key, sender_route_hint, sender_alias, owner.dataValues, realAmount)
		chat = await findOrCreateChatByUUID(
			chat_uuid, [parseInt(owner.id), parseInt(sender.id)], owner.id
		)
		if (sender.fromGroup) { // if a private msg received, update the contact
			await sender.update({ fromGroup: false })
		}
	} else { // group
		sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key, tenant:owner.id } })
		// inject a "sender" with an alias
		if (!sender && chat_type == constants.chat_types.tribe) {
			sender = { id: 0, alias: sender_alias }
		}
		chat = await models.Chat.findOne({ where: { uuid: chat_uuid, tenant:owner.id } })
	}
	return { dest, owner, sender, chat, sender_pub_key, sender_route_hint, sender_alias, isTribeOwner, chat_uuid, amount, content, mediaToken, mediaKey, mediaType, originalMuid, chat_type, msg_id, chat_members, chat_name, chat_host, chat_key, remote_content, msg_uuid, date_string, reply_uuid, skip_payment_processing, purchaser_id, sender_photo_url, network_type, message_status }
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
			...sender.routeHint && {route_hint: sender.routeHint},
			...!dontActuallySendContactKey && {contact_key: sender.contactKey},
			...sender.alias && { alias: sender.alias },
			...includePhotoUrl && { photo_url: sender.photoUrl }
		}
	}
}
