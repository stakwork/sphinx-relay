import { models } from '../models'
import * as chats from './chats'
import * as chatTribes from './chatTribes'
import * as bots from './bots'
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
import * as actions from './api'
import * as queries from './queries'
import { checkTag } from '../utils/gitinfo'
import * as timers from '../utils/timers'
import * as builtInBots from '../builtin'
import constants from '../constants'
import * as feed from './feed'

export async function set(app) {

	builtInBots.init()

	if (models && models.Subscription) {
		subcriptions.initializeCronJobs()
	}

	media.cycleMediaToken()

	timers.reloadTimers()

	queries.startWatchingUTXOs()

	app.get('/chats', chats.getChats)
	app.post('/group', chats.createGroupChat)
	app.put('/chats/:id', chats.updateChat)
	app.post('/chats/:chat_id/:mute_unmute', chats.mute)
	app.delete('/chat/:id', chats.deleteChat)
	app.put('/chat/:id', chats.addGroupMembers)
	app.put('/kick/:chat_id/:contact_id', chats.kickChatMember)
	app.post('/tribe', chatTribes.joinTribe)
	app.put('/member/:contactId/:status/:messageId', chatTribes.approveOrRejectMember)
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

	app.get('/msgs', messages.getMsgs)
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

	app.post('/stream', feed.streamFeed)

	app.get('/app_versions', details.getAppVersions)

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
	app.get('/route', details.checkRoute)

	app.get('/query/onchain_address/:app', queries.queryOnchainAddress)
	app.get('/utxos', queries.listUTXOs)

	app.post('/action', actions.processAction)
	app.get('/bots', bots.getBots)
	app.post('/bot', bots.createBot)
	app.delete('/bot/:id', bots.deleteBot)

	app.get('/healthcheck', confirmations.healthcheck)

	app.get('/version', async function (req, res) {
		const version = await checkTag()
		res.send({ version })
	})

	app.get('/latest', async function (req, res) {
		const lasts = await models.Message.findAll({
			limit: 1,
			order: [['createdAt', 'DESC']]
		})
		const last = lasts && lasts[0]
		if (!last) {
			res.status(404).send('Not found');
		} else {
			res.status(200).send(last.createdAt)
		}
	})
}

const msgtypes = constants.message_types
export const ACTIONS = {
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
	[msgtypes.group_kick]: chats.receiveGroupKick,
	[msgtypes.delete]: messages.receiveDeleteMessage,
	[msgtypes.repayment]: messages.receiveRepayment,
	[msgtypes.member_request]: chatTribes.receiveMemberRequest,
	[msgtypes.member_approve]: chatTribes.receiveMemberApprove,
	[msgtypes.member_reject]: chatTribes.receiveMemberReject,
	[msgtypes.tribe_delete]: chatTribes.receiveTribeDelete,
	[msgtypes.bot_install]: bots.receiveBotInstall,
	[msgtypes.bot_cmd]: bots.receiveBotCmd,
	[msgtypes.bot_res]: bots.receiveBotRes,
	[msgtypes.heartbeat]: confirmations.receiveHeartbeat,
	[msgtypes.heartbeat_confirmation]: confirmations.receiveHeartbeatConfirmation,
	[msgtypes.boost]: messages.receiveBoost,
	[msgtypes.query]: queries.receiveQuery,
	[msgtypes.query_response]: queries.receiveQueryResponse,
}
