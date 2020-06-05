import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as helpers from '../helpers'
import * as network from '../network'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import * as md5 from 'md5'
import * as path from 'path'
import * as tribes from '../utils/tribes'
import {replayChatHistory,createTribeChatParams} from './chatTribes'

const constants = require(path.join(__dirname,'../../config/constants.json'))

async function getChats(req, res) {
	const chats = await models.Chat.findAll({ where:{deleted:false}, raw: true })
	const c = chats.map(chat => jsonUtils.chatToJson(chat));
	success(res, c)
}

async function mute(req, res) {
	const chatId = req.params['chat_id']
	const mute = req.params['mute_unmute']

	if (!["mute", "unmute"].includes(mute)) {
		return failure(res, "invalid option for mute")
	}

	const chat = await models.Chat.findOne({ where: { id: chatId } })

	if (!chat) {
		return failure(res, 'chat not found')
	}

	chat.update({ isMuted: (mute == "mute") })

	success(res, jsonUtils.chatToJson(chat))
}

// just add self here if tribes
// or can u add contacts as members?
async function createGroupChat(req, res) {
	const {
		name,
		is_tribe,
		is_listed,
		price_per_message,
		price_to_join,
		img,
		description,
		tags,
	} = req.body
	const contact_ids = req.body.contact_ids||[]

	const members: { [k: string]: {[k:string]:string} } = {} //{pubkey:{key,alias}, ...}
	const owner = await models.Contact.findOne({ where: { isOwner: true } })

	members[owner.publicKey] = {
		key:owner.contactKey, alias:owner.alias
	}
	await asyncForEach(contact_ids, async cid => {
		const contact = await models.Contact.findOne({ where: { id: cid } })
		members[contact.publicKey] = {
			key: contact.contactKey,
			alias: contact.alias||''
		}
	})

	let chatParams:any = null
	let okToCreate = true
	if(is_tribe){
		chatParams = await createTribeChatParams(owner, contact_ids, name, img, price_per_message, price_to_join)
		if(is_listed && chatParams.uuid){
			// publish to tribe server
			try {
				await tribes.declare({
					uuid: chatParams.uuid,
					name: chatParams.name,
					host: chatParams.host,
					group_key: chatParams.groupKey,
					price_per_message: price_per_message||0,
					price_to_join: price_to_join||0,
					description, tags, img,
					owner_pubkey: owner.publicKey,
					owner_alias: owner.alias,
				})
			} catch(e) {
				okToCreate = false
			}
		}
		// make me owner when i create
		members[owner.publicKey].role = constants.chat_roles.owner
	} else {
		chatParams = createGroupChatParams(owner, contact_ids, members, name)
	}

	if(!okToCreate) {
		return failure(res, 'could not create tribe')
	}

	network.sendMessage({
		chat: { ...chatParams, members },
		sender: owner,
		type: constants.message_types.group_create,
		message: {},
		failure: function (e) {
			failure(res, e)
		},
		success: async function () {
			const chat = await models.Chat.create(chatParams)
			if(chat.type===constants.chat_types.tribe){ // save me as owner when i create
				await models.ChatMember.create({
					contactId: owner.id,
					chatId: chat.id,
					role: constants.chat_roles.owner,
				})
			}
			success(res, jsonUtils.chatToJson(chat))
		}
	})
}

// only owner can do for tribe?
async function addGroupMembers(req, res) {
	const {
		contact_ids,
	} = req.body
	const { id } = req.params

	const members: { [k: string]: {[k:string]:string} } = {}  //{pubkey:{key,alias}, ...}
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	let chat = await models.Chat.findOne({ where: { id } })

	const contactIds = JSON.parse(chat.contactIds || '[]')
	// for all members (existing and new)
	members[owner.publicKey] = {key:owner.contactKey, alias:owner.alias}
	if(chat.type===constants.chat_types.tribe){
		const me = await models.ChatMember.findOne({where:{contactId: owner.id, chatId: chat.id}})
		if(me) members[owner.publicKey].role = me.role
	}
	const allContactIds = contactIds.concat(contact_ids)
	await asyncForEach(allContactIds, async cid => {
		const contact = await models.Contact.findOne({ where: { id: cid } })
		if(contact) {
			members[contact.publicKey] = {
				key: contact.contactKey,
				alias: contact.alias
			}
			const member = await models.ChatMember.findOne({where:{contactId: owner.id, chatId: chat.id}})
			if(member) members[contact.publicKey].role = member.role	
		}
	})

	success(res, jsonUtils.chatToJson(chat))

	network.sendMessage({ // send ONLY to new members
		chat: { ...chat.dataValues, contactIds:contact_ids, members },
		sender: owner,
		type: constants.message_types.group_invite,
		message: {}
	})
}

const deleteChat = async (req, res) => {
	const { id } = req.params

	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	const chat = await models.Chat.findOne({ where: { id } })
	if(!chat) {
		return failure(res, "you are not in this group")
	}

	const tribeOwnerPubKey = chat.ownerPubkey
	if(owner.publicKey===tribeOwnerPubKey) {
		return failure(res, "cannot leave your own tribe")
	}

	network.sendMessage({
		chat,
		sender: owner,
		message: {},
		type: constants.message_types.group_leave,
	})

	await chat.update({
		deleted: true, 
		uuid:'', 
		groupKey:'',
		host:'',
		photoUrl:'',
		contactIds:'[]',
		name:''
	})
	await models.Message.destroy({ where: { chatId: id } })

	success(res, { chat_id: id })
}

async function receiveGroupJoin(payload) {
	console.log('=> receiveGroupJoin')
	const { sender_pub_key, sender_alias, chat_uuid, chat_members, chat_type, isTribeOwner, date_string } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

	const isTribe = chat_type===constants.chat_types.tribe

	var date = new Date()
	date.setMilliseconds(0)
	if(date_string) date=new Date(date_string)

	let theSender: any = null
	const member = chat_members[sender_pub_key]
	const senderAlias = sender_alias || (member && member.alias) || 'Unknown'

	if(!isTribe || isTribeOwner) { // dont need to create contacts for these
		const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
		const contactIds = JSON.parse(chat.contactIds || '[]')
		if (sender) {
			theSender = sender // might already include??
			if(!contactIds.includes(sender.id)) contactIds.push(sender.id)
			// update sender contacT_key in case they reset?
			if(member && member.key) {
				if(sender.contactKey!==member.key) {
					await sender.update({contactKey:member.key})
				}
			}
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
				contactIds.push(createdContact.id)
			}
		}
		if(!theSender) return console.log('no sender') // fail (no contact key?)

		await chat.update({ contactIds: JSON.stringify(contactIds) })

		if(isTribeOwner){ // IF TRIBE, ADD TO XREF
			models.ChatMember.create({
				contactId: theSender.id,
				chatId: chat.id,
				role: constants.chat_roles.reader,
				lastActive: date,
			})
			replayChatHistory(chat, theSender)
			tribes.putstats({
				uuid: chat.uuid,
				host: chat.host,
				member_count: contactIds.length,
			})
		}
	}

	const msg:{[k:string]:any} = {
		chatId: chat.id,
		type: constants.message_types.group_join,
		sender: (theSender && theSender.id) || 0,
		date: date,
		messageContent:'',//`${senderAlias} has joined the group`,
		remoteMessageContent:'',
		status: constants.statuses.confirmed,
		createdAt: date,
		updatedAt: date
	}
	if(isTribe) {
		msg.senderAlias = sender_alias
	}
	const message = await models.Message.create(msg)

	socket.sendJson({
		type: 'group_join',
		response: {
			contact: jsonUtils.contactToJson(theSender||{}),
			chat: jsonUtils.chatToJson(chat),
			message: jsonUtils.messageToJson(message, null)
		}
	})
}

async function receiveGroupLeave(payload) {
	console.log('=> receiveGroupLeave')
	const { sender_pub_key, chat_uuid, chat_type, sender_alias, isTribeOwner, date_string } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

	const isTribe = chat_type===constants.chat_types.tribe

	let sender
	if(!isTribe || isTribeOwner) {
		sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
		if (!sender) return

		const oldContactIds = JSON.parse(chat.contactIds || '[]')
		const contactIds = oldContactIds.filter(cid => cid !== sender.id)
		await chat.update({ contactIds: JSON.stringify(contactIds) })

		if(isTribeOwner) {
			if(chat_type===constants.chat_types.tribe){
				try {
					await models.ChatMember.destroy({where:{chatId: chat.id, contactId: sender.id}})
				} catch(e) {}
				tribes.putstats({
					uuid: chat.uuid,
					host: chat.host,
					member_count: contactIds.length,
				})
			}
		}
	}

	var date = new Date();
	date.setMilliseconds(0)
	if(date_string) date=new Date(date_string)
	const msg:{[k:string]:any} = {
		chatId: chat.id,
		type: constants.message_types.group_leave,
		sender: (sender && sender.id) || 0,
		date: date,
		messageContent:'', //`${sender_alias} has left the group`,
		remoteMessageContent:'',
		status: constants.statuses.confirmed,
		createdAt: date,
		updatedAt: date
	}
	if(isTribe) {
		msg.senderAlias = sender_alias
	}
	const message = await models.Message.create(msg)

	socket.sendJson({
		type: 'group_leave',
		response: {
			contact: jsonUtils.contactToJson(sender),
			chat: jsonUtils.chatToJson(chat),
			message: jsonUtils.messageToJson(message, null)
		}
	})
}

async function validateTribeOwner(chat_uuid: string, pubkey: string){
	const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(chat_uuid)
	if(verifiedOwnerPubkey===pubkey){
		return true
	}
	return false
}
async function receiveGroupCreateOrInvite(payload) {
	const { sender_pub_key, chat_members, chat_name, chat_uuid, chat_type, chat_host, chat_key } = await helpers.parseReceiveParams(payload)

	// maybe this just needs to move to adding tribe owner ChatMember?
	const isTribe = chat_type===constants.chat_types.tribe
	if(isTribe){ // must be sent by tribe owner?????
		const validOwner = await validateTribeOwner(chat_uuid, sender_pub_key)
		if(!validOwner) return console.log('[tribes] invalid uuid signature!')
	}

	const contacts: any[] = []
	const newContacts: any[] = []
	for (let [pubkey, member] of Object.entries(chat_members)) {
		const contact = await models.Contact.findOne({ where: { publicKey: pubkey } })
		let addContact = false
		if (chat_type===constants.chat_types.group && member && member.key) {
			addContact = true
		} else if(isTribe && member && member.role) {
			if (member.role===constants.chat_roles.owner || member.role===constants.chat_roles.admin || member.role===constants.chat_roles.mod){
				addContact = true
			}
		}
		if(addContact){
			if (!contact) {
				const createdContact = await models.Contact.create({
					publicKey: pubkey,
					contactKey: member.key,
					alias: member.alias||'Unknown',
					status: 1,
					fromGroup: true,
				})
				contacts.push({...createdContact.dataValues,role:member.role})
				newContacts.push(createdContact.dataValues)
			} else {
				contacts.push({...contact.dataValues,role:member.role})
			}
		}
	}
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	const contactIds = contacts.map(c=>c.id)
	if(!contactIds.includes(owner.id)) contactIds.push(owner.id)
	// make chat
	let date = new Date()
	date.setMilliseconds(0)
	const chat = await models.Chat.create({
		uuid: chat_uuid,
		contactIds: JSON.stringify(contactIds),
		createdAt: date,
		updatedAt: date,
		name: chat_name,
		type: chat_type || constants.chat_types.group,
		...chat_host && { host: chat_host },
		...chat_key && { groupKey: chat_key },
	})

	if(isTribe){ // IF TRIBE, ADD TO XREF
		contacts.forEach(c=>{
			models.ChatMember.create({
				contactId: c.id,
				chatId: chat.id,
				role: c.role||constants.chat_roles.reader,
				lastActive: date,
			})
		})
	}

	socket.sendJson({
		type: 'group_create',
		response: jsonUtils.messageToJson({ newContacts }, chat)
	})

	sendNotification(chat, chat_name, 'group')

	if (payload.type === constants.message_types.group_invite) {
		const owner = await models.Contact.findOne({ where: { isOwner: true } })
		network.sendMessage({
			chat: {
				...chat.dataValues, members: {
					[owner.publicKey]: {
						key: owner.contactKey,
						alias: owner.alias||''
					}
				}
			},
			sender: owner,
			message: {},
			type: constants.message_types.group_join,
		})
	}
}

function createGroupChatParams(owner, contactIds, members, name) {
	let date = new Date()
	date.setMilliseconds(0)
	if (!(owner && members && contactIds && Array.isArray(contactIds))) {
		return
	}

	const pubkeys: string[] = []
	for (let pubkey of Object.keys(members)) { // just the key
		pubkeys.push(String(pubkey))
	}
	if (!(pubkeys && pubkeys.length)) return

	const allkeys = pubkeys.includes(owner.publicKey) ? pubkeys : [owner.publicKey].concat(pubkeys)
	const hash = md5(allkeys.sort().join("-"))
	const theContactIds = contactIds.includes(owner.id) ? contactIds : [owner.id].concat(contactIds)
	return {
		uuid: `${new Date().valueOf()}-${hash}`,
		contactIds: JSON.stringify(theContactIds),
		createdAt: date,
		updatedAt: date,
		name: name,
		type: constants.chat_types.group
	}
}

export {
	getChats, mute, addGroupMembers,
	receiveGroupCreateOrInvite, createGroupChat,
	deleteChat, receiveGroupLeave, receiveGroupJoin,
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}

