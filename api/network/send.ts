import { models } from '../models'
import * as LND from '../utils/lightning'
import {personalizeMessage} from '../utils/msg'
import * as path from 'path'
import * as tribes from '../utils/tribes'

const constants = require(path.join(__dirname,'../../config/constants.json'))

export function signAndSend(opts){
	return new Promise(async function(resolve, reject) {
		if(!opts.data || typeof opts.data!=='object') {
			return reject('object plz')
		}
		let data = JSON.stringify(opts.data)
		// SIGN HERE and append sig
		const sig = await LND.signAscii(data)
		data = data + sig

		console.log("DATA")
		console.log(opts.data)

		try {
			const payload = opts.data
			if(payload.chat&&payload.chat.type===constants.chat_types.tribe) {
				// if owner pub to mqtt all group members (but not to self!!!)
				const chatUUID = payload.chat.uuid
				const recipient = opts.dest
				if(!chatUUID || !recipient) return
				const tribeOwnerPubKey = await tribes.verifySignedTimestamp(chatUUID)
				const owner = await models.Contact.findOne({ where: { isOwner: true } })
				if(owner.publicKey===tribeOwnerPubKey){
					tribes.publish(`${recipient}/${chatUUID}`, data)
				} else {
					// else keysend to owner ONLY
					if(recipient===tribeOwnerPubKey) {
						LND.keysendMessage({...opts,data})
					}
				}
			} else {
				LND.keysendMessage({...opts,data})
			}
		} catch(e) {
			throw e
		}
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