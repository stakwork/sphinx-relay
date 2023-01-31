import { models, Message } from '../models'
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
import * as actions from './botapi'
import * as queries from './queries'
import * as gitinfo from '../utils/gitinfo'
import * as timers from '../utils/timers'
import * as builtInBots from '../builtin'
import * as admin from './admin'
import constants from '../constants'
import * as feed from './feed'
import { failure } from '../utils/res'
import * as auth from './auth'
import * as personal from './api/personal'
import * as lsats from './lsats'
import { Req } from '../types'
import * as action from './actionHistory'
import * as feeds from './getFeeds'
import * as contentFeedStatus from './contentFeedStatus'

export async function set(app) {
  builtInBots.init()

  if (models && models.Subscription) {
    subcriptions.initializeCronJobs()
  }

  // media.cycleMediaToken()

  timers.reloadTimers()

  // queries.startWatchingUTXOs();

  app.get('/chats', chats.getChats)
  app.post('/group', chats.createGroupChat)
  app.put('/chats/:id', chats.updateChat)
  app.post('/chats/:chat_id/:mute_unmute', chats.mute)
  app.put('/notify/:chat_id/:level', chats.setNotifyLevel)
  app.delete('/chat/:id', chats.deleteChat)
  app.put('/chat/:id', chats.addGroupMembers)
  app.put('/kick/:chat_id/:contact_id', chats.kickChatMember)
  app.post('/tribe', chatTribes.joinTribe)
  app.post('/tribe_channel', chatTribes.createChannel)
  app.delete('/tribe_channel', chatTribes.deleteChannel)
  app.post('/tribe_member', chats.addTribeMember)
  app.put(
    '/member/:contactId/:status/:messageId',
    chatTribes.approveOrRejectMember
  )
  app.put('/group/:id', chatTribes.editTribe)
  app.put('/chat_pin/:id', chatTribes.pinToTribe)

  app.post('/upload', uploads.avatarUpload.single('file'), uploads.uploadFile)

  app.post('/invites', invites.createInvite)
  app.post('/invites/:invite_string/pay', invites.payInvite)
  app.post('/invites/finish', invites.finishInvite)

  app.post('/contacts/tokens', contacts.generateToken)
  app.get('/contacts', contacts.getContacts)
  app.get('/contacts/:chat_id', contacts.getContactsForChat)
  app.put('/contacts/:id', contacts.updateContact)
  app.put('/block/:contact_id', contacts.blockContact)
  app.put('/unblock/:contact_id', contacts.unblockContact)
  app.post('/contacts/:id/keys', contacts.exchangeKeys)
  app.post('/contacts', contacts.createContact)
  app.delete('/contacts/:id', contacts.deleteContact)
  app.get('/latest_contacts', contacts.getLatestContacts)
  app.post('/generate_external', contacts.generateOwnerWithExternalSigner)
  app.post('/hmac_key', contacts.registerHmacKey)
  app.get('/hmac_key', contacts.getHmacKey)

  app.post('/profile', personal.createPeopleProfile)
  app.delete('/profile', personal.deletePersonProfile)
  app.post('/delete_ticket', personal.deleteTicketByAdmin)
  app.post('/public_pic', personal.uploadPublicPic)
  app.get('/refresh_jwt', personal.refreshJWT)
  app.post('/claim_on_liquid', personal.claimOnLiquid)
  app.post('/create_badge', personal.createBadge)
  app.post('/transfer_badge', personal.transferBadge)
  app.get('/badges', personal.getAllBadge)

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
  app.get(
    '/subscriptions/contact/:contactId',
    subcriptions.getSubscriptionsForContact
  )
  app.put('/subscription/:id/pause', subcriptions.pauseSubscription)
  app.put('/subscription/:id/restart', subcriptions.restartSubscription)

  app.post('/attachment', media.sendAttachmentMessage)
  app.post('/purchase', media.purchase)
  app.get('/signer/:challenge', media.signer)

  app.post('/verify_external', auth.verifyAuthRequest)
  app.get('/request_transport_key', auth.requestTransportKey)

  app.post('/stream', feed.streamFeed)

  app.get('/app_versions', details.getAppVersions)
  app.get('/relay_version', details.getRelayVersion)

  app.post('/invoices', invoices.createInvoice)
  app.get('/invoices', invoices.listInvoices)
  app.put('/invoices', invoices.payInvoice)
  app.post('/invoices/cancel', invoices.cancelInvoice)

  app.post('/payment', payments.sendPayment)
  app.get('/payments', payments.listPayments)

  app.get('/channels', details.getChannels)
  app.get('/balance', details.getBalance)
  app.get('/balance/all', details.getLocalRemoteBalance)
  app.get('/getinfo', details.getLightningInfo)
  app.get('/logs', details.getLogsSince)
  app.get('/info', details.getNodeInfo)
  app.get('/route', details.checkRoute)
  app.get('/route2', details.checkRouteByContactOrChat)
  app.get('/test_clear', details.clearForTesting)

  app.get('/query/onchain_address/:app', queries.queryOnchainAddress)
  app.get('/utxos', queries.listUTXOs)

  app.post('/webhook', actions.processWebhook)
  app.post('/action', actions.processAction)
  app.get('/bots', bots.getBots)
  app.post('/bot', bots.createBot)
  app.delete('/bot/:id', bots.deleteBot)
  app.post('/bot/git', bots.addPatToGitBot)
  app.get('/badge_bot/:chatId', bots.getBagdeChatBot)

  app.get('/healthcheck', confirmations.healthcheck)

  app.get('/add_user', admin.addProxyUser)
  app.get('/list_users', admin.listUsers)
  app.get('/has_admin', admin.hasAdmin)

  app.get('/version', async function (req: Req, res) {
    res.send({ version: gitinfo.tag })
  })

  app.post('/action_history', action.saveAction)
  app.post('/action_history_bulk', action.saveActionBulk)
  app.get('/action_history', action.getActionHistory)

  app.get('/latest', async function (req: Req, res) {
    if (!req.owner) return failure(res, 'no owner')
    const tenant: number = req.owner.id
    const lasts: Message[] = (await models.Message.findAll({
      limit: 1,
      order: [['createdAt', 'DESC']],
      where: { tenant },
    })) as Message[]
    const last = lasts && lasts[0]
    if (!last) {
      res.status(404).send('Not found')
    } else {
      res.status(200).send(last.createdAt)
    }
  })

  app.get('/lsats', lsats.listLsats)
  app.get('/lsats/:identifier', lsats.getLsat)
  app.post('/lsats', lsats.saveLsat)
  app.put('/lsats/:identifier', lsats.updateLsat)
  app.delete('/lsats/:identifier', lsats.deleteLsat)
  app.get('/active_lsat', lsats.getActiveLsat)

  // Get feeds
  app.get('/feeds', feeds.getFeeds)

  // Content Feed Status
  app.post('/content_feed_status', contentFeedStatus.addContentFeedStatus)
  app.get('/content_feed_status', contentFeedStatus.getContentFeedStatus)
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
