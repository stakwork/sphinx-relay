import { models } from './models'
import * as LND from './utils/lightning'
import {personalizeMessage} from './utils/msg'

// const constants = require('../config/constants.json');

/*
Abstracts between lightning network and MQTT depending on Chat type and sender
*/

export function signAndSend(opts){
	return new Promise(async function(resolve, reject) {
		if(!opts.data || typeof opts.data!=='object') {
			return reject('object plz')
		}
		let data = JSON.stringify(opts.data)
		// SIGN HERE and append sig
		const sig = await LND.signAscii(data)
		data = data + sig

		// if tribe 
			// if owner pub to mqtt
			// else keysend to owner ONLY
		// else:
		LND.keysendMessage({...opts,data})
	})
}

export async function sendMessage(params) {
	const { type, chat, message, sender, amount, success, failure } = params
	const m = newmsg(type, chat, sender, message)

	const contactIds = typeof chat.contactIds==='string' ? JSON.parse(chat.contactIds) : chat.contactIds

	let yes:any = null
	let no:any = null
	console.log('all contactIds',contactIds)
	await asyncForEach(contactIds, async contactId => {
		if (contactId == sender.id) {
			return
		}

		console.log('-> sending to contact #', contactId)

		const contact = await models.Contact.findOne({ where: { id: contactId } })
		const destkey = contact.publicKey

		const finalMsg = await personalizeMessage(m, contactId, destkey)

		const opts = {
			dest: destkey,
			data: finalMsg,
			amt: Math.max(amount, 3)
		}
		try {
			const r = await signAndSend(opts)
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
			...chat.type && { type: chat.type },
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