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
const lndService = require("../grpc");
const gitinfo_1 = require("../utils/gitinfo");
const lightning_1 = require("../utils/lightning");
const constants = require(__dirname + '/../../config/constants.json');
const env = process.env.NODE_ENV || 'development';
console.log("=> env:", env);
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
};
function iniGrpcSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield lightning_1.checkConnection();
            const types = constants.message_types;
            yield lndService.subscribeInvoices({
                [types.contact_key]: controllers.contacts.receiveContactKey,
                [types.contact_key_confirmation]: controllers.contacts.receiveConfirmContactKey,
                [types.message]: controllers.messages.receiveMessage,
                [types.invoice]: controllers.invoices.receiveInvoice,
                [types.direct_payment]: controllers.payments.receivePayment,
                [types.confirmation]: controllers.confirmations.receiveConfirmation,
                [types.attachment]: controllers.media.receiveAttachment,
                [types.purchase]: controllers.media.receivePurchase,
                [types.purchase_accept]: controllers.media.receivePurchaseAccept,
                [types.purchase_deny]: controllers.media.receivePurchaseDeny,
                [types.group_create]: controllers.chats.receiveGroupCreateOrInvite,
                [types.group_invite]: controllers.chats.receiveGroupCreateOrInvite,
                [types.group_join]: controllers.chats.receiveGroupJoin,
                [types.group_leave]: controllers.chats.receiveGroupLeave,
            });
        }
        catch (e) {
            throw e;
        }
    });
}
exports.iniGrpcSubscriptions = iniGrpcSubscriptions;
function set(app) {
    return __awaiter(this, void 0, void 0, function* () {
        if (models_1.models && models_1.models.Subscription) {
            controllers.subcriptions.initializeCronJobs();
        }
        try {
            yield controllers.media.cycleMediaToken();
        }
        catch (e) {
            console.log('=> could not auth with media server', e.message);
        }
        app.get('/chats', controllers.chats.getChats);
        app.post('/group', controllers.chats.createGroupChat);
        app.post('/chats/:chat_id/:mute_unmute', controllers.chats.mute);
        app.delete('/chat/:id', controllers.chats.deleteChat);
        app.put('/chat/:id', controllers.chats.addGroupMembers);
        app.post('/contacts/tokens', controllers.contacts.generateToken);
        app.post('/upload', controllers.uploads.avatarUpload.single('file'), controllers.uploads.uploadFile);
        app.post('/invites', controllers.invites.createInvite);
        app.post('/invites/:invite_string/pay', controllers.invites.payInvite);
        app.post('/invites/finish', controllers.invites.finishInvite);
        app.get('/contacts', controllers.contacts.getContacts);
        app.put('/contacts/:id', controllers.contacts.updateContact);
        app.post('/contacts/:id/keys', controllers.contacts.exchangeKeys);
        app.post('/contacts', controllers.contacts.createContact);
        app.delete('/contacts/:id', controllers.contacts.deleteContact);
        app.get('/messages', controllers.messages.getMessages);
        app.delete('/message/:id', controllers.messages.deleteMessage);
        app.post('/messages', controllers.messages.sendMessage);
        app.post('/messages/:chat_id/read', controllers.messages.readMessages);
        app.post('/messages/clear', controllers.messages.clearMessages);
        app.get('/subscriptions', controllers.subcriptions.getAllSubscriptions);
        app.get('/subscription/:id', controllers.subcriptions.getSubscription);
        app.delete('/subscription/:id', controllers.subcriptions.deleteSubscription);
        app.post('/subscriptions', controllers.subcriptions.createSubscription);
        app.put('/subscription/:id', controllers.subcriptions.editSubscription);
        app.get('/subscriptions/contact/:contactId', controllers.subcriptions.getSubscriptionsForContact);
        app.put('/subscription/:id/pause', controllers.subcriptions.pauseSubscription);
        app.put('/subscription/:id/restart', controllers.subcriptions.restartSubscription);
        app.post('/attachment', controllers.media.sendAttachmentMessage);
        app.post('/purchase', controllers.media.purchase);
        app.get('/signer/:challenge', controllers.media.signer);
        app.post('/invoices', controllers.invoices.createInvoice);
        app.get('/invoices', controllers.invoices.listInvoices);
        app.put('/invoices', controllers.invoices.payInvoice);
        app.post('/invoices/cancel', controllers.invoices.cancelInvoice);
        app.post('/payment', controllers.payments.sendPayment);
        app.get('/payments', controllers.payments.listPayments);
        app.get('/channels', controllers.details.getChannels);
        app.get('/balance', controllers.details.getBalance);
        app.get('/balance/all', controllers.details.getLocalRemoteBalance);
        app.get('/getinfo', controllers.details.getInfo);
        app.get('/logs', controllers.details.getLogsSince);
        app.get('/info', controllers.details.getNodeInfo);
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
//# sourceMappingURL=index.js.map