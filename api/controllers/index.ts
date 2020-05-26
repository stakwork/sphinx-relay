import {models} from '../models'
import {checkTag} from '../utils/gitinfo'

const env = process.env.NODE_ENV || 'development';
console.log("=> env:",env)

let controllers = {
	messages: require('./messages'),
	invoices: require('./invoices'),
	uploads: require('./uploads'),
	contacts: require('./contacts'),
	invites: require('./invites'),
	payments: require('./payment'),
	details: require('./details'),
	chats: require('./chats'),
	subcriptions: require('./subscriptions'),
	media: require('./media'),
	confirmations: require('./confirmations')
}

async function set(app) {

	if(models && models.Subscription){
		controllers.subcriptions.initializeCronJobs()
	}
	try{
		await controllers.media.cycleMediaToken()
	} catch(e) {
		console.log('=> could not auth with media server', e.message)
	}

	app.get('/chats', controllers.chats.getChats)
	app.post('/group', controllers.chats.createGroupChat)
	app.post('/chats/:chat_id/:mute_unmute', controllers.chats.mute)
	app.delete('/chat/:id', controllers.chats.deleteChat)
	app.put('/chat/:id', controllers.chats.addGroupMembers)
	app.post('/tribe', controllers.chats.joinTribe)
	app.put('/tribe', controllers.chats.editTribe)

	app.post('/contacts/tokens', controllers.contacts.generateToken)

	app.post('/upload', controllers.uploads.avatarUpload.single('file'), controllers.uploads.uploadFile)

	app.post('/invites', controllers.invites.createInvite)
	app.post('/invites/:invite_string/pay', controllers.invites.payInvite)
	app.post('/invites/finish', controllers.invites.finishInvite)

	app.get('/contacts', controllers.contacts.getContacts)
	app.put('/contacts/:id', controllers.contacts.updateContact)
	app.post('/contacts/:id/keys', controllers.contacts.exchangeKeys)
	app.post('/contacts', controllers.contacts.createContact)
	app.delete('/contacts/:id', controllers.contacts.deleteContact)

	app.get('/allmessages', controllers.messages.getAllMessages)
	app.get('/messages', controllers.messages.getMessages)
	app.delete('/message/:id', controllers.messages.deleteMessage)
	app.post('/messages', controllers.messages.sendMessage)
	app.post('/messages/:chat_id/read', controllers.messages.readMessages)
	app.post('/messages/clear', controllers.messages.clearMessages)

	app.get('/subscriptions', controllers.subcriptions.getAllSubscriptions)
	app.get('/subscription/:id', controllers.subcriptions.getSubscription)
	app.delete('/subscription/:id', controllers.subcriptions.deleteSubscription)
	app.post('/subscriptions', controllers.subcriptions.createSubscription)
	app.put('/subscription/:id', controllers.subcriptions.editSubscription)
	app.get('/subscriptions/contact/:contactId', controllers.subcriptions.getSubscriptionsForContact)
	app.put('/subscription/:id/pause', controllers.subcriptions.pauseSubscription)
	app.put('/subscription/:id/restart', controllers.subcriptions.restartSubscription)
	
	app.post('/attachment', controllers.media.sendAttachmentMessage)
	app.post('/purchase', controllers.media.purchase)
	app.get('/signer/:challenge', controllers.media.signer)

	app.post('/invoices', controllers.invoices.createInvoice)
	app.get('/invoices', controllers.invoices.listInvoices)
	app.put('/invoices', controllers.invoices.payInvoice)
	app.post('/invoices/cancel', controllers.invoices.cancelInvoice)

	app.post('/payment', controllers.payments.sendPayment)
	app.get('/payments', controllers.payments.listPayments)

	app.get('/channels', controllers.details.getChannels)
	app.get('/balance', controllers.details.getBalance)
	app.get('/balance/all', controllers.details.getLocalRemoteBalance)
	app.get('/getinfo', controllers.details.getInfo)
	app.get('/logs', controllers.details.getLogsSince)
	app.get('/info', controllers.details.getNodeInfo)

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

export {set, controllers}
