import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as helpers from '../helpers'
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

async function createGroupChat(req, res) {
	const {
		name,
		contact_ids,
		is_public,
	} = req.body

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
	if(is_public){
		chatParams = await createPublicGroupChatParams(owner, contact_ids, name)
		// and publish to tribes server? so can be discovered
	} else {
		chatParams = createGroupChatParams(owner, contact_ids, members, name)
	}

	helpers.sendMessage({
		chat: { ...chatParams, members },
		sender: owner,
		type: constants.message_types.group_create,
		message: {},
		failure: function (e) {
			failure(res, e)
		},
		success: async function () {
			const chat = await models.Chat.create(chatParams)
			success(res, jsonUtils.chatToJson(chat))
		}
	})
}

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
	const allContactIds = contactIds.concat(contact_ids)
	await asyncForEach(allContactIds, async cid => {
		const contact = await models.Contact.findOne({ where: { id: cid } })
		if(contact) {
			members[contact.publicKey] = {
				key: contact.contactKey,
				alias: contact.alias
			}
		}
	})

	success(res, jsonUtils.chatToJson(chat))

	helpers.sendMessage({ // send ONLY to new members
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
	helpers.sendMessage({
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

async function receiveGroupLeave(payload) {
	console.log('=> receiveGroupLeave')
	const { sender_pub_key, chat_uuid } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
	if (!sender) return

	const oldContactIds = JSON.parse(chat.contactIds || '[]')
	const contactIds = oldContactIds.filter(cid => cid !== sender.id)
	await chat.update({ contactIds: JSON.stringify(contactIds) })

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

async function receiveGroupJoin(payload) {
	console.log('=> receiveGroupJoin')
	const { sender_pub_key, chat_uuid, chat_members } = await helpers.parseReceiveParams(payload)

	const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
	if (!chat) return

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
	await chat.update({ contactIds: JSON.stringify(contactIds) })

	var date = new Date();
	date.setMilliseconds(0)
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

async function receiveGroupCreateOrInvite(payload) {
	const { chat_members, chat_name, chat_uuid } = await helpers.parseReceiveParams(payload)

	const contactIds: number[] = []
	const newContacts: any[] = []
	for (let [pubkey, member] of Object.entries(chat_members)) {
		const contact = await models.Contact.findOne({ where: { publicKey: pubkey } })
		if (!contact && member && member.key) {
			const createdContact = await models.Contact.create({
				publicKey: pubkey,
				contactKey: member.key,
				alias: member.alias||'Unknown',
				status: 1
			})
			contactIds.push(createdContact.id)
			newContacts.push(createdContact.dataValues)
		} else {
			contactIds.push(contact.id)
		}
	}
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	if(!contactIds.includes(owner.id)) contactIds.push(owner.id)
	// make chat
	let date = new Date();
	date.setMilliseconds(0)
	const chat = await models.Chat.create({
		uuid: chat_uuid,
		contactIds: JSON.stringify(contactIds),
		createdAt: date,
		updatedAt: date,
		name: chat_name,
		type: constants.chat_types.group
	})

	socket.sendJson({
		type: 'group_create',
		response: jsonUtils.messageToJson({ newContacts }, chat)
	})

	sendNotification(chat, chat_name, 'group')

	if (payload.type === constants.message_types.group_invite) {
		const owner = await models.Contact.findOne({ where: { isOwner: true } })
		helpers.sendMessage({
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
	let date = new Date();
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

async function createPublicGroupChatParams(owner, contactIds, name) {
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
		type: constants.chat_types.public_group,
		groupKey: keys.public,
		groupPrivateKey: keys.private,
		host: tribes.getHost()
	}
}

export {
	getChats, mute, addGroupMembers,
	receiveGroupCreateOrInvite, createGroupChat,
	deleteChat, receiveGroupLeave, receiveGroupJoin
}


async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}