import {models} from '../models'
import * as socket from '../utils/socket'
import { sendNotification } from '../hub'
import * as jsonUtils from '../utils/json'
import * as decodeUtils from '../utils/decode'
import {loadLightning, SPHINX_CUSTOM_RECORD_KEY} from '../utils/lightning'

const constants = require(__dirname + '/../../config/constants.json');

function parseKeysendInvoice(i, actions){
	const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records
	const buf = recs && recs[SPHINX_CUSTOM_RECORD_KEY]
	const data = buf && buf.toString()
	const value = i && i.value && parseInt(i.value)
	if(!data) return

	let payload
	if(data[0]==='{'){
		try {
			payload = JSON.parse(data)
		} catch(e){}
	} else {
		const threads = weave(data)
		if(threads) payload = JSON.parse(threads)
	}
	if(payload){
		const dat = payload.content || payload
		if(value && dat && dat.message){
			dat.message.amount = value
		}
		if(actions[payload.type]) {
			actions[payload.type](payload)
		} else {
			console.log('Incorrect payload type:', payload.type)
		}
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

		var call = lightning.subscribeInvoices();
		call.on('data', async function(response) {
			// console.log('subscribed invoices', { response })
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
					socket.sendJson({
						type: 'invoice_payment',
						response: {invoice: response['payment_request']}
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
			resolve(status)
		});
		call.on('error', function(err){
			// console.log(err)
			reject(err)
		})
		call.on('end', function() {
			console.log("Closed stream");
			// The server has closed the stream.
		});
		setTimeout(()=>{
			resolve(null)
		},100)
	})
}

export {
	subscribeInvoices,
}
