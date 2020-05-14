import {models} from '../models'
import * as socket from '../utils/socket'
import { sendNotification, sendInvoice } from '../hub'
import * as jsonUtils from '../utils/json'
import * as decodeUtils from '../utils/decode'
import {loadLightning, SPHINX_CUSTOM_RECORD_KEY, verifyAscii} from '../utils/lightning'
import * as controllers from '../controllers'
import * as moment from 'moment'
import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))
const ERR_CODE_UNAVAILABLE = 14

// VERIFY PUBKEY OF SENDER
async function parseAndVerifyPayload(data){
	let payload
	const li = data.lastIndexOf('}')
	const msg = data.substring(0,li+1)
	const sig = data.substring(li+1)
	try {
		payload = JSON.parse(msg)
		if(payload) {
			const v = await verifyAscii(msg, sig)
			if(v && v.valid && v.pubkey) {
				payload.sender = payload.sender||{}
				payload.sender.pub_key=v.pubkey
				return payload
			} else {
				console.error('[GRPC] invalid payload signature')
			}
		}
	} catch(e) {
		console.error('[GRPC] failed to parse msg')
		return null
	}
}

async function parseKeysendInvoice(i, actions){
	const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records
	const buf = recs && recs[SPHINX_CUSTOM_RECORD_KEY]
	const data = buf && buf.toString()
	const value = i && i.value && parseInt(i.value)
	if(!data) {
		console.error('[GRPC] no keysend data received')
		return
	}

	let payload
	if(data[0]==='{'){
		try {
			payload = await parseAndVerifyPayload(data)
		} catch(e){
			console.error('[GRPC] failed to parse and verify payload')
		}
	} else {
		const threads = weave(data)
		if(threads) {
			try {
				payload = await parseAndVerifyPayload(threads)
			} catch(e){
				console.error('[GRPC] failed to parse and verify payload II')
			}
		}
	}
	if(payload){
		const dat = payload.content || payload
		if(value && dat && dat.message){
			dat.message.amount = value // ADD IN TRUE VALUE
		}
		if(actions[payload.type]) {
			actions[payload.type](payload)
		} else {
			console.log('Incorrect payload type:', payload.type)
		}
	} else {
		console.error('[GRPC] no payload')
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

function subscribeInvoices(actions) {	
	return new Promise(async(resolve,reject)=>{
		const lightning = await loadLightning()

		var call = lightning.subscribeInvoices()
		call.on('data', async function(response) {
			// console.log('subscribed invoices', { response })
			console.log('[GRPC] subscribeInvoices received')
			if (response['state'] !== 'SETTLED') {
				return
			}
			// console.log("IS KEYSEND", response.is_keysend)
			if(response.is_keysend) {
				parseKeysendInvoice(response, actions)
			} else {
				const invoice = await models.Message.findOne({ where: { type: constants.message_types.invoice, payment_request: response['payment_request'] } })
				if (invoice == null) {
					// console.log("ERROR: Invoice " + response['payment_request'] + " not found");
					const payReq = response['payment_request']
					const amount = response['amt_paid_sat']
					if (process.env.HOSTING_PROVIDER==='true'){
						sendInvoice(payReq, amount)
					}
					socket.sendJson({
						type: 'invoice_payment',
						response: {invoice: payReq}
					})
					return
				}
				models.Message.update({ status: constants.statuses.confirmed }, { where: { id: invoice.id } })

				let decodedPaymentRequest = decodeUtils.decode(response['payment_request']);

				var paymentHash = "";
				for (var i=0; i<decodedPaymentRequest["data"]["tags"].length; i++) {
					let tag = decodedPaymentRequest["data"]["tags"][i];
					if (tag['description'] == 'payment_hash') {
						paymentHash = tag['value'];
						break;
					}
				}

				let settleDate = parseInt(response['settle_date'] + '000');

				const chat = await models.Chat.findOne({ where: { id: invoice.chatId } })
				const contactIds = JSON.parse(chat.contactIds)
				const senderId = contactIds.find(id => id != invoice.sender)

				const message = await models.Message.create({
					chatId: invoice.chatId,
					type: constants.message_types.payment,
					sender: senderId,
					amount: response['amt_paid_sat'],
					amountMsat: response['amt_paid_msat'],
					paymentHash: paymentHash,
					date: new Date(settleDate),
					messageContent: response['memo'],
					status: constants.statuses.confirmed,
					createdAt: new Date(settleDate),
					updatedAt: new Date(settleDate)
				})

				const sender = await models.Contact.findOne({ where: { id: senderId } })

				socket.sendJson({
					type: 'payment',
					response: jsonUtils.messageToJson(message, chat, sender)
				})

				sendNotification(chat, sender.alias, 'message')
			}
		});
		call.on('status', function(status) {
			console.log("Status", status);
			// The server is unavailable, trying to reconnect.
			if (status.code == ERR_CODE_UNAVAILABLE) {
				reconnectToLND();
			} else {
				resolve(status);
			}
		})
		call.on('error', function(err){
			console.error(err)
			if (err.code == ERR_CODE_UNAVAILABLE) {
				reconnectToLND();
			} else {
				reject(err)
			}
		})
		call.on('end', function() {
			const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
			console.log(`Closed stream ${now}`);
			// The server has closed the stream.
			reconnectToLND()
		})
		setTimeout(()=>{
			resolve(null)
		},100)
	})
}

var i = 0
async function reconnectToLND(){
	i++
	console.log(`=> [lnd] reconnecting... attempt #${i}`)
	try {
		await controllers.iniGrpcSubscriptions()
		const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
		console.log(`=> [lnd] reconnected! ${now}`)
	} catch(e) {
		setTimeout(async()=>{ // retry each 2 secs
			await reconnectToLND()
		},2000)
	}
}

export {
	subscribeInvoices,
}
