import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as helpers from '../helpers'
import * as network from '../network'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import * as md5 from 'md5'
import * as path from 'path'
import * as rsa from '../crypto/rsa'
import * as tribes from '../utils/tribes'

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
		// price_per_message,
		// price_to_join,
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
	if(is_tribe){
		chatParams = await createTribeChatParams(owner, contact_ids, name)
		if(is_listed){
			// publish to tribe server
		}
		// make me owner when i create
		members[owner.publicKey].role = constants.chat_roles.owner
	} else {
		chatParams = createGroupChatParams(owner, contact_ids, members, name)
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
	network.sendMessage({
		chat,
		sender: owner,
		message: {},
		type: constants.message_types.group_leave,
	})

	await chat.update({
		deleted: true, 
		uuid:'', 
		contactIds:'[]',
		name:''
	})
	await models.Message.destroy({ where: { chatId: id } })

	success(res, { chat_id: id })
}

async function joinTribe(req, res){
	console.log('=> joinTribe')
	const { uuid, group_key, name, host } = req.body
	const ownerPubKey = await tribes.verifySignedTimestamp(uuid)

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
			alias: 'Unknown',
			status: 1
		})
		theTribeOwner = createdContact
		contactIds.push(createdContact.id)
	}
	let date = new Date()
	date.setMilliseconds(0)
	const chat = await models.Chat.create({
		uuid: uuid,
		contactIds: JSON.stringify(contactIds),
		createdAt: date,
		updatedAt: date,
		name: name,
		type: constants.chat_types.tribe,
		host: host || tribes.getHost(),
		groupKey: group_key,
	})
	models.ChatMember.create({
		contactId: theTribeOwner.id,
		chatId: chat.id,
		role: constants.chat_roles.owner,
		lastActive: date,
	})
	
	network.sendMessage({ // send my data to tribe owner
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

async function receiveGroupLeave(payload) {
	console.log('=> receiveGroupLeave')
	const { sender_pub_key, chat_uuid, chat_type } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
	if (!sender) return

	const oldContactIds = JSON.parse(chat.contactIds || '[]')
	const contactIds = oldContactIds.filter(cid => cid !== sender.id)
	await chat.update({ contactIds: JSON.stringify(contactIds) })

	if(chat_type===constants.chat_types.tribe){
		await models.ChatMember.destroy({where:{chatId: chat.id, contactId: sender.id}})
	}

	var date = new Date();
	date.setMilliseconds(0)
	const msg = {
		chatId: chat.id,
		type: constants.message_types.group_leave,
		sender: sender.id,
		date: date,
		messageContent: '',
		remoteMessageContent: '',
		status: constants.statuses.confirmed,
		createdAt: date,
		updatedAt: date
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

// only owner needs to add!
// here: can only join if enough $$$!
// forward to all over mqtt
// add to ChatMember table
async function receiveGroupJoin(payload) {
	console.log('=> receiveGroupJoin')
	const { sender_pub_key, chat_uuid, chat_members, chat_type } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

	// THIS CHECK CAN BE DONE IN NETWORK.RECEIVE? --> forward to mqtt if needed to
	const isTribe = chat_type===constants.chat_types.tribe
	if(isTribe) {
		const owner = await models.Contact.findOne({ where: { isOwner: true } })
		const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(chat_uuid)
		if(verifiedOwnerPubkey!==owner.publicKey){
			return // SKIP if not owner (not each member needs to be added)
			// but maybe we need to add alias in there somehow? so other people can see "Evan joined"
		}
	}

	let theSender: any = null
	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
	const contactIds = JSON.parse(chat.contactIds || '[]')
	if (sender) {
		theSender = sender // might already include??
		if(!contactIds.includes(sender.id)) contactIds.push(sender.id)
	} else {
		const member = chat_members[sender_pub_key]
		if(member && member.key) {
			const createdContact = await models.Contact.create({
				publicKey: sender_pub_key,
				contactKey: member.key,
				alias: member.alias||'Unknown',
				status: 1
			})
			theSender = createdContact
			contactIds.push(createdContact.id)
		}
	}
	if(!theSender) return // fail (no contact key?)

	await chat.update({ contactIds: JSON.stringify(contactIds) })

	var date = new Date()
	date.setMilliseconds(0)

	if(isTribe){ // IF TRIBE, ADD TO XREF
		models.ChatMember.create({
			contactId: theSender.id,
			chatId: chat.id,
			role: constants.chat_roles.reader,
			lastActive: date,
		})
	}

	const msg = {
		chatId: chat.id,
		type: constants.message_types.group_join,
		sender: theSender.id,
		date: date,
		messageContent: '',
		remoteMessageContent: '',
		status: constants.statuses.confirmed,
		createdAt: date,
		updatedAt: date
	}
	const message = await models.Message.create(msg)

	socket.sendJson({
		type: 'group_join',
		response: {
			contact: jsonUtils.contactToJson(theSender),
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
					status: 1
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

async function createTribeChatParams(owner, contactIds, name) {
	let date = new Date()
	date.setMilliseconds(0)
	if (!(owner && contactIds && Array.isArray(contactIds))) {
		return
	}

	// make ts sig here w LNd pubkey - that is UUID
	const keys:{[k:string]:string} = await rsa.genKeys()
	const groupUUID = await tribes.genSignedTimestamp()
	const theContactIds = contactIds.includes(owner.id) ? contactIds : [owner.id].concat(contactIds)
	return {
		uuid: groupUUID,
		contactIds: JSON.stringify(theContactIds),
		createdAt: date,
		updatedAt: date,
		name: name,
		type: constants.chat_types.tribe,
		groupKey: keys.public,
		groupPrivateKey: keys.private,
		host: tribes.getHost()
	}
}

export {
	getChats, mute, addGroupMembers,
	receiveGroupCreateOrInvite, createGroupChat,
	deleteChat, receiveGroupLeave, receiveGroupJoin,
	joinTribe,
}


async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}