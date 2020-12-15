import { models } from '../models'
import * as LND from '../utils/lightning'
import * as signer from '../utils/signer'
import { personalizeMessage, decryptMessage } from '../utils/msg'
import * as tribes from '../utils/tribes'
import { tribeOwnerAutoConfirmation } from '../controllers/confirmations'
import { typesToForward } from './receive'
import * as intercept from './intercept'
import constants from '../constants'

type NetworkType = undefined | 'mqtt' | 'lightning'

export async function sendMessage(params) {
	const { type, chat, message, sender, amount, success, failure, skipPubKey, isForwarded, realSatsContactId } = params
	if (!chat || !sender) return

	const isTribe = chat.type === constants.chat_types.tribe
	let isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey

	let theSender = (sender.dataValues || sender)
	if (isTribeOwner && !isForwarded) {
		theSender = { ...(sender.dataValues || sender), role: constants.chat_roles.owner }
	}
	let msg = newmsg(type, chat, theSender, message, isForwarded)

	// console.log("=> MSG TO SEND",msg)

	// console.log(type,message)
	if (!(sender && sender.publicKey)) {
		console.log("NO SENDER?????")
		return
	}

	let contactIds = (typeof chat.contactIds === 'string' ? JSON.parse(chat.contactIds) : chat.contactIds) || []
	if (contactIds.length === 1) {
		if (contactIds[0] === 1) {
			if (success) success(true)
			return // if no contacts thats fine (like create public tribe)
		}
	}

	let networkType: NetworkType = undefined
	const chatUUID = chat.uuid
	if (isTribe) {
		if (type === constants.message_types.confirmation) {
			// if u are owner, go ahead!
			if (!isTribeOwner) return // dont send confs for tribe if not owner
		}
		if (isTribeOwner) {
			networkType = 'mqtt' // broadcast to all
			// decrypt message.content and message.mediaKey w groupKey
			msg = await decryptMessage(msg, chat)
			// console.log("SEND.TS isBotMsg")
			const isBotMsg = await intercept.isBotMsg(msg, true)
			if (isBotMsg === true) {
				// return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
			}
			// post last_active to tribes server
			tribes.putActivity(chat.uuid, chat.host)
		} else {
			// if tribe, send to owner only
			const tribeOwner = await models.Contact.findOne({ where: { publicKey: chat.ownerPubkey } })
			contactIds = tribeOwner ? [tribeOwner.id] : []
		}
	}

	let yes: any = true
	let no: any = null
	console.log('=> sending to', contactIds.length, 'contacts')
	await asyncForEach(contactIds, async contactId => {
		if (contactId == 1) { // dont send to self
			return
		}

		const contact = await models.Contact.findOne({ where: { id: contactId } })
		if (!contact) {
			return // skip if u simply dont have the contact
		}
		const destkey = contact.publicKey
		if (destkey === skipPubKey) {
			return // skip (for tribe owner broadcasting, not back to the sender)
		}
		// console.log('-> sending to ', contact.id, destkey)

		let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : ''

		// sending a payment to one subscriber, buying a pic from OG poster
		// or boost to og poster
		if (isTribeOwner && amount && realSatsContactId === contactId) {
			mqttTopic = '' // FORCE KEYSEND!!!
		}

		const m = await personalizeMessage(msg, contact, isTribeOwner)
		// console.log('-> personalized msg',m)
		const opts = {
			dest: destkey,
			data: m,
			amt: Math.max((amount || 0), constants.min_sat_amount)
		}

		try {
			const r = await signAndSend(opts, mqttTopic)
			yes = r
		} catch (e) {
			console.log("KEYSEND ERROR", e)
			no = e
		}
		await sleep(10)
	})
	if (no) {
		if (failure) failure(no)
	} else {
		if (success) success(yes)
	}
}

export function signAndSend(opts, mqttTopic?: string, replayingHistory?: boolean) {
	// console.log('sign and send!',opts)
	return new Promise(async function (resolve, reject) {
		if (!opts || typeof opts !== 'object') {
			return reject('object plz')
		}
		if (!opts.dest) {
			return reject('no dest pubkey')
		}
		let data = JSON.stringify(opts.data || {})
		opts.amt = opts.amt || 0

		const sig = await signer.signAscii(data)
		data = data + sig

		// console.log("-> ACTUALLY SEND: topic:", mqttTopic)
		try {
			if (mqttTopic) {
				await tribes.publish(mqttTopic, data, function () {
					if (!replayingHistory) {
						if (mqttTopic) checkIfAutoConfirm(opts.data)
					}
				})
			} else {
				await LND.keysendMessage({ ...opts, data })
			}
			resolve(true)
		} catch (e) {
			reject(e)
		}
	})
}

function checkIfAutoConfirm(data) {
	if (typesToForward.includes(data.type)) {
		if (data.type === constants.message_types.delete) {
			return // dont auto confirm delete msg
		}
		tribeOwnerAutoConfirmation(data.message.id, data.chat.uuid)
	}
}

export function newmsg(type, chat, sender, message, isForwarded: boolean, includeStatus?: boolean) {
	const includeGroupKey = type === constants.message_types.group_create || type === constants.message_types.group_invite
	const includeAlias = sender && sender.alias && chat.type === constants.chat_types.tribe
	let aliasToInclude = sender.alias
	if (!isForwarded && includeAlias && chat.myAlias) {
		aliasToInclude = chat.myAlias
	}
	const includePhotoUrl = sender && !sender.privatePhoto && chat && chat.type === constants.chat_types.tribe
	let photoUrlToInclude = sender.photoUrl || ''
	if (!isForwarded && includePhotoUrl && chat.myPhotoUrl) {
		photoUrlToInclude = chat.myPhotoUrl
	}
	if (!includeStatus && message.status) {
		delete message.status
	}
	return {
		type: type,
		chat: {
			uuid: chat.uuid,
			...chat.name && { name: chat.name },
			...(chat.type || chat.type === 0) && { type: chat.type },
			...chat.members && { members: chat.members },
			...(includeGroupKey && chat.groupKey) && { groupKey: chat.groupKey },
			...(includeGroupKey && chat.host) && { host: chat.host }
		},
		message: message,
		sender: {
			pub_key: sender.publicKey,
			alias: includeAlias ? aliasToInclude : '',
			role: sender.role || constants.chat_roles.reader,
			...includePhotoUrl && { photo_url: photoUrlToInclude },
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

// function urlBase64FromHex(ascii){
//     return Buffer.from(ascii,'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
// function urlBase64FromBytes(buf){
//     return Buffer.from(buf).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }