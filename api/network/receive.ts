import * as path from 'path'
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

/*
delete type:
owner needs to check that the delete is the one who made the msg
in receiveDeleteMessage check the deleter is og sender?
*/

const constants = require(path.join(__dirname,'../../config/constants.json'))
const msgtypes = constants.message_types

export const typesToForward=[
	msgtypes.message, msgtypes.group_join, msgtypes.group_leave, msgtypes.attachment, msgtypes.delete
]
const typesToModify=[
	msgtypes.attachment
]
const typesThatNeedPricePerMessage = [
	msgtypes.message, msgtypes.attachment
]
export const typesToReplay=[ // should match typesToForward
	msgtypes.message, msgtypes.group_join, msgtypes.group_leave
]
async function onReceive(payload){
	// if tribe, owner must forward to MQTT
	let doAction = true
	const toAddIn:{[k:string]:any} = {}
	let isTribe = false
	let isTribeOwner = false
	let chat
	if(payload.chat) {
		isTribe = payload.chat.type===constants.chat_types.tribe
		chat = await models.Chat.findOne({where:{uuid:payload.chat.uuid}})
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
		// check price to join
		if(payload.type===msgtypes.group_join) {
			if(payload.message.amount<chat.priceToJoin) doAction=false
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
		if(doAction) forwardMessageToTribe(payload, senderContact)
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
	if(payload.isTribeOwner) {
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

async function forwardMessageToTribe(ogpayload, sender){
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
			...payload.sender&&payload.sender.alias && {alias:payload.sender.alias}
		},
		chat: chat,
		skipPubKey: payload.sender.pub_key, 
		success: ()=>{},
		receive: ()=>{}
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
			// console.log("=====> msg received! TOPIC", topic, "MESSAGE", msg)
			// check topic is signed by sender?
			const payload = await parseAndVerifyPayload(msg)
			onReceive(payload)
		} catch(e){}
    })
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

export async function parseKeysendInvoice(i){
	const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records
	const buf = recs && recs[SPHINX_CUSTOM_RECORD_KEY]
	const data = buf && buf.toString()
	const value = i && i.value && parseInt(i.value)
	if(!data) return

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
