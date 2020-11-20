import * as lndService from '../grpc'
import {getInfo} from '../utils/lightning'
import {ACTIONS} from '../controllers'
import * as tribes from '../utils/tribes'
import {SPHINX_CUSTOM_RECORD_KEY} from '../utils/lightning'
import * as signer from '../utils/signer'
import { models } from '../models'
import {sendMessage} from './send'
import {modifyPayloadAndSaveMediaKey,purchaseFromOriginalSender,sendFinalMemeIfFirstPurchaser} from './modify'
import {decryptMessage,encryptTribeBroadcast} from '../utils/msg'
import { Op } from 'sequelize'
import * as timers from '../utils/timers'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import constants from '../constants'
import * as jsonUtils from '../utils/json'

/*
delete type:
owner needs to check that the delete is the one who made the msg
in receiveDeleteMessage check the deleter is og sender?
*/

const msgtypes = constants.message_types

export const typesToForward=[
	msgtypes.message, msgtypes.group_join, msgtypes.group_leave, 
	msgtypes.attachment, msgtypes.delete, msgtypes.boost,
]
const typesToModify=[
	msgtypes.attachment
]
const typesThatNeedPricePerMessage = [
	msgtypes.message, msgtypes.attachment, msgtypes.boost
]
export const typesToReplay=[ // should match typesToForward
	msgtypes.message, 
	msgtypes.group_join, 
	msgtypes.group_leave,
	msgtypes.bot_res,
]
const botTypes=[
	constants.message_types.bot_install,
	constants.message_types.bot_cmd,
	constants.message_types.bot_res,
]
const botMakerTypes=[
	constants.message_types.bot_install,
	constants.message_types.bot_cmd,
]
async function onReceive(payload){
	// console.log('===> onReceive',JSON.stringify(payload,null,2))
	if(!(payload.type||payload.type===0)) return console.log('no payload.type')

	if(botTypes.includes(payload.type)) {
		// if is admin on tribe? or is bot maker?
		console.log("=> got bot msg type!!!!")
		if(botMakerTypes.includes(payload.type)) {
			if(!payload.bot_uuid) return console.log('bot maker type: no bot uuid')
		}
		return ACTIONS[payload.type](payload)
	}
	
	// if tribe, owner must forward to MQTT
	let doAction = true
	const toAddIn:{[k:string]:any} = {}
	let isTribe = false
	let isTribeOwner = false
	let chat

	if(payload.chat&&payload.chat.uuid) {
		isTribe = payload.chat.type===constants.chat_types.tribe
		chat = await models.Chat.findOne({where:{uuid:payload.chat.uuid}})
		if(chat) chat.update({seen:false})
	}
	if(isTribe) {
		const tribeOwnerPubKey = chat && chat.ownerPubkey
		const owner = await models.Contact.findOne({where: {isOwner:true}})
		isTribeOwner = owner.publicKey===tribeOwnerPubKey
	}
	if(isTribeOwner) toAddIn.isTribeOwner = true
	if(isTribeOwner && typesToForward.includes(payload.type)){
		const needsPricePerMessage = typesThatNeedPricePerMessage.includes(payload.type)
		// CHECK THEY ARE IN THE GROUP if message
		const senderContact = await models.Contact.findOne({where:{publicKey:payload.sender.pub_key}})
		if(needsPricePerMessage) {
			const senderMember = senderContact && await models.ChatMember.findOne({where:{contactId:senderContact.id, chatId:chat.id}})
			if(!senderMember) doAction=false
		}
		// CHECK PRICES
		if(needsPricePerMessage) {
			if(payload.message.amount<chat.pricePerMessage) doAction=false
			if(chat.escrowAmount) {
				timers.addTimer({ // pay them back
					amount: chat.escrowAmount, 
					millis:chat.escrowMillis,
					receiver: senderContact.id,
					msgId: payload.message.id,
					chatId: chat.id,
				})
			}
		}
		// check price to join AND private chat
		if(payload.type===msgtypes.group_join) {
			if(payload.message.amount<chat.priceToJoin) doAction=false
			if(chat.private) { // check if has been approved
				const senderMember = senderContact && await models.ChatMember.findOne({where:{contactId:senderContact.id, chatId:chat.id}})
				if(!(senderMember && senderMember.status===constants.chat_statuses.approved)){
					doAction=false // dont let if private and not approved
				}
			}
		}
		// check that the sender is the og poster
		if(payload.type===msgtypes.delete) {
			doAction = false
			if(payload.message.uuid) {
				const ogMsg = await models.Message.findOne({where:{
					uuid: payload.message.uuid,
					sender: senderContact.id,
				}})
				if(ogMsg) doAction = true
			}
		}
		// forward boost sats to recipient
		let realSatsContactId = null
		if(payload.type===msgtypes.boost && payload.message.replyUuid) {
			const ogMsg = await models.Message.findOne({where:{
				uuid: payload.message.replyUuid,
			}})
			if(ogMsg && ogMsg.sender && ogMsg.sender!==1) {
				const amtToForward = payload.message.amount - (chat.pricePerMessage||0) - (chat.escrowAmount||0)
				if(amtToForward>0) {
					realSatsContactId = ogMsg.sender
				}
			}
		}
		if(doAction) forwardMessageToTribe(payload, senderContact, realSatsContactId)
		else console.log('=> insufficient payment for this action')
	}
	if(isTribeOwner && payload.type===msgtypes.purchase) {
		const mt = payload.message.mediaToken
		const host = mt && mt.split('.').length && mt.split('.')[0]
		const muid = mt && mt.split('.').length && mt.split('.')[1]
		const myAttachmentMessage = await models.Message.findOne({where:{
			mediaToken: {[Op.like]: `${host}.${muid}%`},
			type:msgtypes.attachment, sender:1,
		}})
		if(!myAttachmentMessage) { // someone else's attachment
			const senderContact = await models.Contact.findOne({where:{publicKey:payload.sender.pub_key}})
			purchaseFromOriginalSender(payload, chat, senderContact)
			doAction = false
		}
	}
	if(isTribeOwner && payload.type===msgtypes.purchase_accept) {
		const purchaserID = payload.message&&payload.message.purchaser
		const iAmPurchaser = purchaserID&&purchaserID===1
		if(!iAmPurchaser) {
			const senderContact = await models.Contact.findOne({where:{publicKey:payload.sender.pub_key}})
			sendFinalMemeIfFirstPurchaser(payload, chat, senderContact)
			doAction = false // skip this! we dont need it
		}
	}
	if(doAction) doTheAction({...payload, ...toAddIn})
}

async function doTheAction(data){
	let payload = data
	if(payload.isTribeOwner) { // this is only for storing locally, my own messages as tribe owner
		// actual encryption for tribe happens in personalizeMessage
		const ogContent = data.message && data.message.content
		// const ogMediaKey = data.message && data.message.mediaKey
		/* decrypt and re-encrypt with phone's pubkey for storage */
		const chat = await models.Chat.findOne({where:{uuid:payload.chat.uuid}})
		const pld = await decryptMessage(data, chat)
		const me = await models.Contact.findOne({where:{isOwner:true}})
		payload = await encryptTribeBroadcast(pld, me, true) // true=isTribeOwner
		if(ogContent) payload.message.remoteContent = JSON.stringify({'chat':ogContent}) // this is the key
		//if(ogMediaKey) payload.message.remoteMediaKey = JSON.stringify({'chat':ogMediaKey})
	}
	if(ACTIONS[payload.type]) {
		ACTIONS[payload.type](payload)
	} else {
		console.log('Incorrect payload type:', payload.type)
	}
}

async function forwardMessageToTribe(ogpayload, sender, realSatsContactId){
	// console.log('forwardMessageToTribe')
	const chat = await models.Chat.findOne({where:{uuid:ogpayload.chat.uuid}})

	let payload
	if(sender && typesToModify.includes(ogpayload.type)){
		payload = await modifyPayloadAndSaveMediaKey(ogpayload, chat, sender)
	} else {
		payload = ogpayload
	}
	// dont need sender beyond here

	//const sender = await models.Contact.findOne({where:{publicKey:payload.sender.pub_key}})
	const owner = await models.Contact.findOne({where:{isOwner:true}})
	const type = payload.type
	const message = payload.message
	// HERE: NEED TO MAKE SURE ALIAS IS UNIQUE
	// ASK xref TABLE and put alias there too?
	sendMessage({
		type, message,
		sender: {
			...owner.dataValues,
			...payload.sender&&payload.sender.alias && {alias:payload.sender.alias},
			role: constants.chat_roles.reader,
		},
		chat: chat,
		skipPubKey: payload.sender.pub_key, 
		realSatsContactId: realSatsContactId,
		success: ()=>{},
		receive: ()=>{},
		isForwarded: true,
	})
}

export async function initGrpcSubscriptions() {
	try{
		await getInfo()
		await lndService.subscribeInvoices(parseKeysendInvoice)
	} catch(e) {
		throw e
	}
}

export async function initTribesSubscriptions(){
	tribes.connect(async(topic, message)=>{ // onMessage callback
		try{
			const msg = message.toString()
			// check topic is signed by sender?
			const payload = await parseAndVerifyPayload(msg)
			payload.network_type = constants.network_types.mqtt
			onReceive(payload)
		} catch(e){}
    })
}

function parsePayload(data){
	const li = data.lastIndexOf('}')
	const msg = data.substring(0,li+1)
	try {
		const payload = JSON.parse(msg)
		return payload || ''
	} catch(e) {
		throw e
	}
}

// VERIFY PUBKEY OF SENDER from sig
async function parseAndVerifyPayload(data){
	let payload
	const li = data.lastIndexOf('}')
	const msg = data.substring(0,li+1)
	const sig = data.substring(li+1)
	try {
		payload = JSON.parse(msg)
		if(payload && payload.sender && payload.sender.pub_key) {
			let v
			if(sig.length===96 && payload.sender.pub_key) { // => RM THIS 
				v = await signer.verifyAscii(msg, sig, payload.sender.pub_key)
			}
			if(v && v.valid) {
				return payload
			} else {
				return payload // => RM THIS
			}
		} else {
			return payload // => RM THIS
		}
	} catch(e) {
		if(payload) return payload // => RM THIS
		return null
	}
}

async function saveAnonymousKeysend(response, memo, sender_pubkey) {
	let sender = 0
	if(sender_pubkey) {
		const theSender = await models.Contact.findOne({ where: { publicKey: sender_pubkey }})
		if(theSender && theSender.id) {
			sender = theSender.id
		}
	}
	let settleDate = parseInt(response['settle_date'] + '000');
	const amount = response['amt_paid_sat'] || 0
	const msg = await models.Message.create({
		chatId: 0,
		type: constants.message_types.keysend,
		sender,
		amount,
		amountMsat: response['amt_paid_msat'],
		paymentHash: '',
		date: new Date(settleDate),
		messageContent: memo||'',
		status: constants.statuses.confirmed,
		createdAt: new Date(settleDate),
		updatedAt: new Date(settleDate),
		network_type: constants.network_types.lightning
	})
	socket.sendJson({
		type:'keysend',
		response: jsonUtils.messageToJson(msg,null)
	})
}

export async function parseKeysendInvoice(i){
	const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records
	const buf = recs && recs[SPHINX_CUSTOM_RECORD_KEY]
	const data = buf && buf.toString()
	const value = i && i.value && parseInt(i.value)
	
	// "keysend" type is NOT encrypted
	// and should be saved even if there is NO content
	let isKeysendType = false
	let memo = ''
	let sender_pubkey;
	if(data){
		try {
			const payload = parsePayload(data)
			if(payload && payload.type===constants.message_types.keysend) {
				isKeysendType = true
				memo = payload.message && payload.message.content
				sender_pubkey = payload.sender && payload.sender.pub_key
			}
		} catch(e) {} // err could be a threaded TLV
	} else {
		isKeysendType = true
	}
	if(isKeysendType) {
		if(!memo) {
			sendNotification(-1, '', 'keysend', value||0)
		}
		saveAnonymousKeysend(i, memo, sender_pubkey)
		return
	}

	let payload
	if(data[0]==='{'){
		try {
			payload = await parseAndVerifyPayload(data)
		} catch(e){}
	} else {
		const threads = weave(data)
		if(threads) payload = await parseAndVerifyPayload(threads)
	}
	if(payload){
		const dat = payload
		if(value && dat && dat.message){
			dat.message.amount = value // ADD IN TRUE VALUE
		}
		dat.network_type = constants.network_types.lightning
		onReceive(dat)
	}
}

const chunks = {}
function weave(p){
	const pa = p.split('_')
	if(pa.length<4) return
	const ts = pa[0]
	const i = pa[1]
	const n = pa[2]
	const m = pa.filter((u,i)=>i>2).join('_')
	chunks[ts] = chunks[ts] ? [...chunks[ts], {i,n,m}] : [{i,n,m}]
	if(chunks[ts].length===parseInt(n)){
		// got em all!
		const all = chunks[ts]
		let payload = ''
		all.slice().sort((a,b)=>a.i-b.i).forEach(obj=>{
			payload += obj.m
		})
		delete chunks[ts]
		return payload
	}
}
