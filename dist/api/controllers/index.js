"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const chats = require("./chats");
const chatTribes = require("./chatTribes");
const details = require("./details");
const contacts = require("./contacts");
const invites = require("./invites");
const invoices = require("./invoices");
const media = require("./media");
const messages = require("./messages");
const payments = require("./payment");
const subcriptions = require("./subscriptions");
const uploads = require("./uploads");
const confirmations = require("./confirmations");
const actions = require("./actions");
const gitinfo_1 = require("../utils/gitinfo");
const path = require("path");
const timers = require("../utils/timers");
const env = process.env.NODE_ENV || 'development';
console.log("=> env:", env);
const constants = require(path.join(__dirname, '../../config/constants.json'));
function set(app) {
    return __awaiter(this, void 0, void 0, function* () {
        if (models_1.models && models_1.models.Subscription) {
            subcriptions.initializeCronJobs();
        }
        try {
            yield media.cycleMediaToken();
        }
        catch (e) {
            console.log('=> could not auth with media server', e.message);
        }
        timers.reloadTimers();
        app.get('/chats', chats.getChats);
        app.post('/group', chats.createGroupChat);
        app.put('/chats/:id', chats.updateChat);
        app.post('/chats/:chat_id/:mute_unmute', chats.mute);
        app.delete('/chat/:id', chats.deleteChat);
        app.put('/chat/:id', chats.addGroupMembers);
        app.put('/kick/:chat_id/:contact_id', chats.kickChatMember);
        app.post('/tribe', chatTribes.joinTribe);
        app.put('/member/:contactId/:status/:messageId', chatTribes.approveOrRejectMember);
        app.put('/group/:id', chatTribes.editTribe);
        app.post('/upload', uploads.avatarUpload.single('file'), uploads.uploadFile);
        app.post('/invites', invites.createInvite);
        app.post('/invites/:invite_string/pay', invites.payInvite);
        app.post('/invites/finish', invites.finishInvite);
        app.post('/contacts/tokens', contacts.generateToken);
        app.get('/contacts', contacts.getContacts);
        app.put('/contacts/:id', contacts.updateContact);
        app.post('/contacts/:id/keys', contacts.exchangeKeys);
        app.post('/contacts', contacts.createContact);
        app.delete('/contacts/:id', contacts.deleteContact);
        app.get('/allmessages', messages.getAllMessages);
        app.get('/messages', messages.getMessages);
        app.delete('/message/:id', messages.deleteMessage);
        app.post('/messages', messages.sendMessage);
        app.post('/messages/:chat_id/read', messages.readMessages);
        app.post('/messages/clear', messages.clearMessages);
        app.get('/subscriptions', subcriptions.getAllSubscriptions);
        app.get('/subscription/:id', subcriptions.getSubscription);
        app.delete('/subscription/:id', subcriptions.deleteSubscription);
        app.post('/subscriptions', subcriptions.createSubscription);
        app.put('/subscription/:id', subcriptions.editSubscription);
        app.get('/subscriptions/contact/:contactId', subcriptions.getSubscriptionsForContact);
        app.put('/subscription/:id/pause', subcriptions.pauseSubscription);
        app.put('/subscription/:id/restart', subcriptions.restartSubscription);
        app.post('/attachment', media.sendAttachmentMessage);
        app.post('/purchase', media.purchase);
        app.get('/signer/:challenge', media.signer);
        app.post('/invoices', invoices.createInvoice);
        app.get('/invoices', invoices.listInvoices);
        app.put('/invoices', invoices.payInvoice);
        app.post('/invoices/cancel', invoices.cancelInvoice);
        app.post('/payment', payments.sendPayment);
        app.get('/payments', payments.listPayments);
        app.get('/channels', details.getChannels);
        app.get('/balance', details.getBalance);
        app.get('/balance/all', details.getLocalRemoteBalance);
        app.get('/getinfo', details.getInfo);
        app.get('/logs', details.getLogsSince);
        app.get('/info', details.getNodeInfo);
        app.post('/action', actions.doAction);
        app.get('/version', function (req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                const version = yield gitinfo_1.checkTag();
                res.send({ version });
            });
        });
        if (env != "production") { // web dashboard login
            app.post('/login', login);
        }
    });
}
exports.set = set;
const login = (req, res) => {
    const { code } = req.body;
    if (code == "sphinx") {
        models_1.models.Contact.findOne({ where: { isOwner: true } }).then(owner => {
            res.status(200);
            res.json({ success: true, token: owner.authToken });
            res.end();
        });
    }
    else {
        res.status(200);
        res.json({ success: false });
        res.end();
    }
};
const msgtypes = constants.message_types;
exports.ACTIONS = {
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
    [msgtypes.repayment]: () => { },
    [msgtypes.member_request]: chatTribes.receiveMemberRequest,
    [msgtypes.member_approve]: chatTribes.receiveMemberApprove,
    [msgtypes.member_reject]: chatTribes.receiveMemberReject,
};
//# sourceMappingURL=index.js.map