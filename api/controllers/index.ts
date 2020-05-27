import {models} from '../models'
import * as chats from './chats'
import * as chatTribes from './chatTribes'
import * as details from './details'
import * as contacts from './contacts'
import * as invites from './invites'
import * as invoices from './invoices'
import * as media from './media'
import * as messages from './messages'
import * as payments from './payment'
import * as subcriptions from './subscriptions'
import * as uploads from './uploads'
import * as confirmations from './confirmations'
import {checkTag} from '../utils/gitinfo'
import * as path from 'path'

const env = process.env.NODE_ENV || 'development';
console.log("=> env:",env)
const constants = require(path.join(__dirname,'../../config/constants.json'))

async function set(app) {

	const chat = await models.Chat.findOne({where:{id:31}})
	const contact = await models.Contact.findOne({where:{id:21}})
	if(chat&&contact) chatTribes.replayChatHistory(chat,contact)
	
	if(models && models.Subscription){
		subcriptions.initializeCronJobs()
	}
	try{
		await media.cycleMediaToken()
	} catch(e) {
		console.log('=> could not auth with media server', e.message)
	}

	app.get('/chats', chats.getChats)
	app.post('/group', chats.createGroupChat)
	app.post('/chats/:chat_id/:mute_unmute', chats.mute)
	app.delete('/chat/:id', chats.deleteChat)
	app.put('/chat/:id', chats.addGroupMembers)
	app.post('/tribe', chatTribes.joinTribe)
	app.put('/group/:id', chatTribes.editTribe)

	app.post('/upload', uploads.avatarUpload.single('file'), uploads.uploadFile)

	app.post('/invites', invites.createInvite)
	app.post('/invites/:invite_string/pay', invites.payInvite)
	app.post('/invites/finish', invites.finishInvite)

	app.post('/contacts/tokens', contacts.generateToken)
	app.get('/contacts', contacts.getContacts)
	app.put('/contacts/:id', contacts.updateContact)
	app.post('/contacts/:id/keys', contacts.exchangeKeys)
	app.post('/contacts', contacts.createContact)
	app.delete('/contacts/:id', contacts.deleteContact)

	app.get('/allmessages', messages.getAllMessages)
	app.get('/messages', messages.getMessages)
	app.delete('/message/:id', messages.deleteMessage)
	app.post('/messages', messages.sendMessage)
	app.post('/messages/:chat_id/read', messages.readMessages)
	app.post('/messages/clear', messages.clearMessages)

	app.get('/subscriptions', subcriptions.getAllSubscriptions)
	app.get('/subscription/:id', subcriptions.getSubscription)
	app.delete('/subscription/:id', subcriptions.deleteSubscription)
	app.post('/subscriptions', subcriptions.createSubscription)
	app.put('/subscription/:id', subcriptions.editSubscription)
	app.get('/subscriptions/contact/:contactId', subcriptions.getSubscriptionsForContact)
	app.put('/subscription/:id/pause', subcriptions.pauseSubscription)
	app.put('/subscription/:id/restart', subcriptions.restartSubscription)
	
	app.post('/attachment', media.sendAttachmentMessage)
	app.post('/purchase', media.purchase)
	app.get('/signer/:challenge', media.signer)

	app.post('/invoices', invoices.createInvoice)
	app.get('/invoices', invoices.listInvoices)
	app.put('/invoices', invoices.payInvoice)
	app.post('/invoices/cancel', invoices.cancelInvoice)

	app.post('/payment', payments.sendPayment)
	app.get('/payments', payments.listPayments)

	app.get('/channels', details.getChannels)
	app.get('/balance', details.getBalance)
	app.get('/balance/all', details.getLocalRemoteBalance)
	app.get('/getinfo', details.getInfo)
	app.get('/logs', details.getLogsSince)
	app.get('/info', details.getNodeInfo)

	app.get('/version', async function(req,res) {
		const version = await checkTag()
		res.send({version})
	})

	if (env != "production") { // web dashboard login
		app.post('/login', login)
	}
}

const login = (req, res) => {
	const { code } = req.body;

	if (code == "sphinx") {
		models.Contact.findOne({ where: { isOwner: true } }).then(owner => {
			res.status(200);
			res.json({ success: true, token: owner.authToken });
			res.end();
		})
	} else {
		res.status(200);
		res.json({ success: false });
		res.end();
	}
}

const msgtypes = constants.message_types
const ACTIONS = {
    [msgtypes.contact_key]: contacts.receiveContactKey,
    [msgtypes.contact_key_confirmation]: contacts.receiveConfirmContactKey,
    [msgtypes.message]: messages.receiveMessage,
    [msgtypes.invoice]: invoices.receiveInvoice,
    [msgtypes.direct_payment]: payments.receivePayment,
    [msgtypes.confirmation]: confirmations.receiveConfirmation,
    [msgtypes.attachment]: media.receiveAttachment,
    [msgtypes.purchase]: media.receivePurchase,
    [msgtypes.purchase_accept]: media.receivePurchaseAccept,
    [msgtypes.purchase_deny]: media.receivePurchaseDeny,
    [msgtypes.group_create]: chats.receiveGroupCreateOrInvite,
    [msgtypes.group_invite]: chats.receiveGroupCreateOrInvite,
    [msgtypes.group_join]: chats.receiveGroupJoin,
    [msgtypes.group_leave]: chats.receiveGroupLeave,
}

export {set, ACTIONS} 
