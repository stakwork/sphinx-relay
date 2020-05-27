import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import * as rsa from '../crypto/rsa'
import * as tribes from '../utils/tribes'
import * as path from 'path'
import {personalizeMessage, decryptMessage} from '../utils/msg'

const constants = require(path.join(__dirname,'../../config/constants.json'))

async function joinTribe(req, res){
	console.log('=> joinTribe')
	const { uuid, group_key, name, host, amount, img, owner_pubkey, owner_alias } = req.body

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
	}
	
	network.sendMessage({ // send my data to tribe owner
		chat: {
			...chatParams, members: {
				[owner.publicKey]: {
					key: owner.contactKey,
					alias: owner.alias||''
				}
			}
		},
		amount:amount||0,
		sender: owner,
		message: {},
		type: constants.message_types.group_join,
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
			})
			success(res, jsonUtils.chatToJson(chat))
		}
	})
}

async function editTribe(req, res) {
	const {
		name,
		is_listed,
		price_per_message,
		price_to_join,
		img,
		description,
		tags,
	} = req.body
	const { id } = req.params

	if(!id) return failure(res, 'group id is required')

	const chat = await models.Chat.findOne({where:{id}})
	if(!chat) {
		return failure(res, 'cant find chat')
	}

	const owner = await models.Contact.findOne({ where: { isOwner: true } })

	let okToUpdate = true
	if(is_listed) {
		try{
			await tribes.edit({
				uuid: chat.uuid,
				name: name,
				host: chat.host,
				price_per_message: price_per_message||0,
				price_to_join: price_to_join||0,
				description, 
				tags, 
				img,
				owner_alias: owner.alias,
			})
		} catch(e) {
			okToUpdate = false
		}
	}

	if(okToUpdate) {
		await chat.update({
			photoUrl: img||'',
			name: name,
			pricePerMessage: price_per_message||0,
			priceToJoin: price_to_join||0
		})
		success(res, jsonUtils.chatToJson(chat))
	} else {
		failure(res, 'failed to update tribe')
	}
}

async function replayChatHistory(chat, contact) {
	if(!(chat&&chat.id&&contact&&contact.id)){
		return console.log('[tribes] cant replay history')
	}
	const msgs = await models.Message.findAll({ 
		where:{chatId:chat.id}, 
		order: [['id', 'asc']], 
		limit:40 
	})
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	asyncForEach(msgs, async m=>{
		if(m.type!==constants.message_types.message) return // only for message for now
		const sender = {
			...owner.dataValues,
			...m.senderAlias && {alias: m.senderAlias},
		}
		console.log('sender',sender)
		let content = ''
		try {content = JSON.parse(m.remoteMessageContent)} catch(e) {}
		if(!content) return
		let msg = network.newmsg(m.type, chat, sender, {
			content, // replace with the remoteMessageContent (u are owner)
			...m.mediaKey && {mediaKey: m.mediaKey},
			...m.mediaType && {mediaType: m.mediaType},
			...m.mediaToken && {mediaToken: m.mediaToken}
		})
		console.log('msg',msg)
		msg = await decryptMessage(msg, chat)
		const data = await personalizeMessage(msg, contact, true)
		console.log({data})
		const mqttTopic = `${contact.publicKey}/${chat.uuid}`
		return
		await network.signAndSend({data}, owner.publicKey, mqttTopic)
	})
}


async function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join): Promise<{[k:string]:any}> {
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
	}
}

export {
    joinTribe, editTribe,
    replayChatHistory,
    createTribeChatParams
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}