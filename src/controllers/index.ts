import rateLimit from 'express-rate-limit'
import { models, Message } from '../models'
import { proxyAdminMiddleware as pamid } from '../auth'
import * as gitinfo from '../utils/gitinfo'
import * as timers from '../utils/timers'
import * as builtInBots from '../builtin'
import constants from '../constants'
import { failure } from '../utils/res'
import { Req } from '../types'
import { initializeCronJobsForCallRecordings } from '../builtin/utill/callRecording'
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
import * as admin from './admin'
import * as feed from './feed'
import * as auth from './auth'
import * as personal from './api/personal'
import * as lsats from './lsats'
import * as action from './actionHistory'
import * as feeds from './getFeeds'
import * as contentFeedStatus from './contentFeedStatus'

const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 2, // Limit each IP to 2 requests per `window` (here, per 1 second)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

export async function set(app) {
  builtInBots.init()

  if (models && models.Subscription) {
    subcriptions.initializeCronJobs()
  }

  if (models && models.RecurringCall) {
    initializeCronJobsForCallRecordings()
  }

  if (models && models.Contact) {
    messages.initializeDeleteMessageCronJobs()
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
  app.delete('/tribe_channel', chatTribes.deleteChannel)
  app.put(
    '/member/:contactId/:status/:messageId',
    chatTribes.approveOrRejectMember
  )
  app.put('/group/:id', chatTribes.editTribe)
  app.put('/chat_pin/:id', chatTribes.pinToTribe)
  app.post('/preview/:chat_id', chats.addTribePreivew)

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
  app.delete('/badge/:id', personal.deleteBadge)
  app.post('/add_badge', personal.addBadgeToTribe)
  app.put('/update_badge', personal.updateBadge)
  app.get('/badge_templates', personal.badgeTemplates)
  app.get('/badge_per_tribe/:chat_id', personal.getBadgePerTribe)
  app.post('/remove_badge', personal.removeBadgeFromTribe)
  app.put('/reissue_badge', personal.reissueBadge)

  app.get('/msgs', messages.getMsgs)
  app.get('/allmessages', messages.getAllMessages)
  app.get('/messages', messages.getMessages)
  app.delete('/message/:id', messages.deleteMessage)
  app.post('/messages/:chat_id/read', messages.readMessages)
  app.post('/messages/clear', messages.clearMessages)
  app.delete('/messages', messages.disappearingMessages)
  app.get('/message/:uuid', messages.getMessageByUuid)

  app.get('/subscriptions', subcriptions.getAllSubscriptions)
  app.get('/subscription/:id', subcriptions.getSubscription)
  app.delete('/subscription/:id', subcriptions.deleteSubscription)
  app.put('/subscription/:id', subcriptions.editSubscription)
  app.get(
    '/subscriptions/contact/:contactId',
    subcriptions.getSubscriptionsForContact
  )
  app.put('/subscription/:id/pause', subcriptions.pauseSubscription)
  app.put('/subscription/:id/restart', subcriptions.restartSubscription)

  app.get('/signer/:challenge', media.signer)
  app.post('/verify_external', auth.verifyAuthRequest)
  app.get('/request_transport_key', auth.requestTransportKey)

  app.get('/app_versions', details.getAppVersions)
  app.get('/relay_version', details.getRelayVersion)

  app.get('/invoices', invoices.listInvoices)
  app.get('/invoice', invoices.getInvoice)

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
  app.get('/content_feed_status', contentFeedStatus.getAllContentFeedStatus)
  app.put(
    '/content_feed_status/:feed_id',
    contentFeedStatus.updateContentFeedStatus
  )
  app.get(
    '/content_feed_status/:feed_id',
    contentFeedStatus.getContentFeedStatus
  )

  app.get('/my_ip', (request, response) => response.send(request.ip))

  // open
  app.get('/has_admin', admin.hasAdmin)
  app.get('/initial_admin_pubkey', admin.initialAdminPubkey)

  // following routes are only for proxy admin user (isAdmin=true)
  app.get('/add_user', pamid, admin.addProxyUser)
  app.get('/list_users', pamid, admin.listUsers)
  app.post('/default_tribe/:id', pamid, admin.addDefaultJoinTribe)
  app.delete('/default_tribe/:id', pamid, admin.removeDefaultJoinTribe)
  app.get('/tribes', pamid, admin.listTribes)
  app.get('/admin_balance', pamid, admin.adminBalance)

  // rate limit these routes:
  app.use(limiter)

  app.post('/messages', messages.sendMessage)

  app.post('/contacts/:id/keys', contacts.exchangeKeys)
  app.post('/contacts', contacts.createContact)

  app.post('/tribe', chatTribes.joinTribe)
  app.post('/tribe_channel', chatTribes.createChannel)
  app.post('/tribe_member', chats.addTribeMember)

  app.post('/attachment', media.sendAttachmentMessage)
  app.post('/purchase', media.purchase)

  app.post('/stream', feed.streamFeed)

  app.post('/invoices', invoices.createInvoice)
  app.put('/invoices', invoices.payInvoice)
  app.post('/invoices/cancel', invoices.cancelInvoice)

  app.post('/payment', payments.sendPayment)

  app.post('/subscriptions', subcriptions.createSubscription)
  app.post('/update_channel_policy', details.updateChannelPolicy)

  app.post('/swarm_admin_register', admin.swarmAdminRegister)
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
  [msgtypes.call]: messages.receiveVoip,
}
