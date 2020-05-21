import { models } from '../models'
import * as LND from '../utils/lightning'
import {personalizeMessage, decryptMessage} from '../utils/msg'
import * as path from 'path'
import * as tribes from '../utils/tribes'

const constants = require(path.join(__dirname,'../../config/constants.json'))

type NetworkType = undefined | 'mqtt' | 'lightning'

export async function sendMessage(params) {
	const { type, chat, message, sender, amount, success, failure, skipPubKey } = params
	const m = newmsg(type, chat, sender, message)
	let msg = m

	// console.log(type,message)
	if(!sender) {
		console.log("NO SENDER?????")
		return
	}

	let contactIds = (typeof chat.contactIds==='string' ? JSON.parse(chat.contactIds) : chat.contactIds) || []
	if(contactIds.length===1) {
		if (contactIds[0]===1) {
			if(success) success(true)
			return // if no contacts thats fine (like create public tribe)
		}
	}

	let networkType:NetworkType = undefined
	const isTribe = chat.type===constants.chat_types.tribe
	let isTribeOwner = false
	const chatUUID = chat.uuid
	if(isTribe) {
		if(type===constants.message_types.confirmation) {
			return // dont send confs for tribe
		}
		console.log("is tribe!")
		const tribeOwnerPubKey = await tribes.verifySignedTimestamp(chatUUID)
		if(sender.publicKey===tribeOwnerPubKey){
			console.log('im owner! mqtt!')
			isTribeOwner = true
			networkType = 'mqtt' // broadcast to all
			// decrypt message.content and message.mediaKey w groupKey
			msg = await decryptMessage(msg, chat)
		} else {
			// if tribe, send to owner only
			const tribeOwner = await models.Contact.findOne({where: {publicKey:tribeOwnerPubKey}})
			contactIds = tribeOwner ? [tribeOwner.id] : []
		}
	}

	let yes:any = null
	let no:any = null
	console.log('all contactIds',contactIds)
	await asyncForEach(contactIds, async contactId => {
		if (contactId == 1) { // dont send to self
			return
		}

		const contact = await models.Contact.findOne({ where: { id: contactId } })
		const destkey = contact.publicKey
		if(destkey===skipPubKey) {
			return // skip (for tribe owner broadcasting, not back to the sender)
		}
		console.log('-> sending to ', contact.id, destkey)

		const m = await personalizeMessage(msg, contact, isTribeOwner)
		const opts = {
			dest: destkey,
			data: m,
			amt: Math.max((amount||0), 3)
		}

		try {
			const mqttTopic = networkType==='mqtt' ? `${destkey}/${chatUUID}` : ''
			const r = await signAndSend(opts, mqttTopic)
			yes = r
		} catch (e) {
			console.log("KEYSEND ERROR", e)
			no = e
		}
		await sleep(2)
	})
	if(yes){
		if(success) success(yes)
	} else {
		if(failure) failure(no)
	}
}

export function signAndSend(opts, mqttTopic?:string){
	// console.log('sign and send!!!!',opts.data)
	return new Promise(async function(resolve, reject) {
		if(!opts.data || typeof opts.data!=='object') {
			return reject('object plz')
		}
		let data = JSON.stringify(opts.data)

		const sig = await LND.signAscii(data)
		data = data + sig

		// console.log("ACTUALLY SEND", mqttTopic)
		try {
			if(mqttTopic) {
				await tribes.publish(mqttTopic, data)
			} else {
				await LND.keysendMessage({...opts,data})
			}
			resolve(true)
		} catch(e) {
			reject(e)
		}
	})
}

function newmsg(type, chat, sender, message){
	const includeGroupKey = type===constants.message_types.group_create || type===constants.message_types.group_invite
	const includeAlias = sender && sender.alias && chat.type===constants.chat_types.tribe
	return {
		type: type,
		chat: {
			uuid: chat.uuid,
			...chat.name && { name: chat.name },
			...(chat.type||chat.type===0) && { type: chat.type },
			...chat.members && { members: chat.members },
			...(includeGroupKey&&chat.groupKey) && { groupKey: chat.groupKey },
			...(includeGroupKey&&chat.host) && { host: chat.host }
		},
		message: message,
		sender: {
			...includeAlias && {alias: sender.alias},
			// pub_key: sender.publicKey,
			// ...sender.contactKey && {contact_key: sender.contactKey}
		}
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}
async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}