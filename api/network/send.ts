import { models } from '../models'
import * as LND from '../utils/lightning'
import {personalizeMessage, decryptMessage} from '../utils/msg'
import * as path from 'path'
import * as tribes from '../utils/tribes'

const constants = require(path.join(__dirname,'../../config/constants.json'))

type NetworkType = undefined | 'mqtt' | 'lightning'

export function signAndSend(opts, mqttTopic?:string){
	return new Promise(async function(resolve, reject) {
		if(!opts.data || typeof opts.data!=='object') {
			return reject('object plz')
		}
		let data = JSON.stringify(opts.data)

		const sig = await LND.signAscii(data)
		data = data + sig

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

export async function sendMessage(params) {
	const { type, chat, message, sender, amount, success, failure } = params
	const m = newmsg(type, chat, sender, message)
	let msg = m

	let contactIds = (typeof chat.contactIds==='string' ? JSON.parse(chat.contactIds) : chat.contactIds) || []
	if(contactIds.length===1) {
		if (contactIds[0]===1) {
			if(success) success(true)
			return // if no contacts thats fine (like create public tribe)
		}
	}

	let networkType:NetworkType = undefined
	const isTribe = chat.type===constants.chat_types.tribe
	const chatUUID = chat.uuid
	if(isTribe) {
		console.log("is tribe!")
		const tribeOwnerPubKey = await tribes.verifySignedTimestamp(chatUUID)
		if(sender.publicKey===tribeOwnerPubKey){
			console.log('im owner! mqtt!')
			networkType = 'mqtt' // broadcast to all
			// decrypt message.content and message.mediaKey w groupKey
			msg = await decryptMessage(msg, chat)
			console.log('msg has been decrypted with group key')
		} else {
			// if tribe, send to owner only
			const tribeOwner = await models.Contact.findOne({where: {publicKey:tribeOwnerPubKey}})
			contactIds = [tribeOwner.id]
		}
	}

	let yes:any = null
	let no:any = null
	console.log('all contactIds',contactIds)
	await asyncForEach(contactIds, async contactId => {
		if (contactId == sender.id) {
			return
		}

		const contact = await models.Contact.findOne({ where: { id: contactId } })
		const destkey = contact.publicKey
		console.log('-> sending to ', contact.id, destkey)

		const m = await personalizeMessage(msg, contact)
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
	})
	if(yes){
		if(success) success(yes)
	} else {
		if(failure) failure(no)
	}
}

function newmsg(type, chat, sender, message){
	return {
		type: type,
		chat: {
			uuid: chat.uuid,
			...chat.name && { name: chat.name },
			...(chat.type||chat.type===0) && { type: chat.type },
			...chat.members && { members: chat.members },
			...chat.groupKey && { groupKey: chat.groupKey },
			...chat.host && { host: chat.host }
		},
		message: message,
		// sender: {
		// 	pub_key: sender.publicKey,
		// 	// ...sender.contactKey && {contact_key: sender.contactKey}
		// }
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}