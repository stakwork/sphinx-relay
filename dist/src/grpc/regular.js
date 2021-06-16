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
exports.receiveNonKeysend = exports.loginvoice = void 0;
const models_1 = require("../models");
const socket = require("../utils/socket");
const hub_1 = require("../hub");
const jsonUtils = require("../utils/json");
const decodeUtils = require("../utils/decode");
const constants_1 = require("../constants");
const lightning_1 = require("./lightning");
const oktolog = false;
function loginvoice(response) {
    if (!oktolog)
        return;
    const r = JSON.parse(JSON.stringify(response));
    r.r_hash = '';
    r.r_preimage = '';
    r.htlcs = r.htlcs && r.htlcs.map(h => (Object.assign(Object.assign({}, h), { custom_records: {} })));
    console.log("AN INVOICE WAS RECIEVED!!!=======================>", JSON.stringify(r, null, 2));
}
exports.loginvoice = loginvoice;
function receiveNonKeysend(response) {
    return __awaiter(this, void 0, void 0, function* () {
        let decodedPaymentRequest = decodeUtils.decode(response['payment_request']);
        var paymentHash = "";
        for (var i = 0; i < decodedPaymentRequest["data"]["tags"].length; i++) {
            let tag = decodedPaymentRequest["data"]["tags"][i];
            if (tag['description'] == 'payment_hash') {
                paymentHash = tag['value'];
                break;
            }
        }
        let settleDate = parseInt(response['settle_date'] + '000');
        const invoice = yield models_1.models.Message.findOne({ where: { type: constants_1.default.message_types.invoice, payment_request: response['payment_request'] } });
        if (invoice == null) {
            const invoice = yield lightning_1.decodePayReq(response['payment_request']);
            if (!invoice)
                return console.log("subscribeInvoices: couldn't decode pay req");
            if (!invoice.destination)
                return console.log("subscribeInvoices: cant get dest from pay req");
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true, publicKey: invoice.destination } });
            if (!owner)
                return console.log('subscribeInvoices: no owner found');
            const tenant = owner.id;
            const payReq = response['payment_request'];
            const amount = response['amt_paid_sat'];
            if (process.env.HOSTING_PROVIDER === 'true') {
                hub_1.sendInvoice(payReq, amount);
            }
            socket.sendJson({
                type: 'invoice_payment',
                response: { invoice: payReq }
            }, tenant);
            yield models_1.models.Message.create({
                chatId: 0,
                type: constants_1.default.message_types.payment,
                sender: 0,
                amount: response['amt_paid_sat'],
                amountMsat: response['amt_paid_msat'],
                paymentHash: paymentHash,
                date: new Date(settleDate),
                messageContent: response['memo'],
                status: constants_1.default.statuses.confirmed,
                createdAt: new Date(settleDate),
                updatedAt: new Date(settleDate),
                network_type: constants_1.default.network_types.lightning,
                tenant,
            });
            return;
        }
        // invoice is defined
        const tenant = invoice.tenant;
        const owner = yield models_1.models.Contact.findOne({ where: { id: tenant } });
        models_1.models.Message.update({ status: constants_1.default.statuses.confirmed }, { where: { id: invoice.id } });
        const chat = yield models_1.models.Chat.findOne({ where: { id: invoice.chatId, tenant } });
        const contactIds = JSON.parse(chat.contactIds);
        const senderId = contactIds.find(id => id != invoice.sender);
        const message = yield models_1.models.Message.create({
            chatId: invoice.chatId,
            type: constants_1.default.message_types.payment,
            sender: senderId,
            amount: response['amt_paid_sat'],
            amountMsat: response['amt_paid_msat'],
            paymentHash: paymentHash,
            date: new Date(settleDate),
            messageContent: response['memo'],
            status: constants_1.default.statuses.confirmed,
            createdAt: new Date(settleDate),
            updatedAt: new Date(settleDate),
            network_type: constants_1.default.network_types.lightning,
            tenant,
        });
        const sender = yield models_1.models.Contact.findOne({ where: { id: senderId, tenant } });
        socket.sendJson({
            type: 'payment',
            response: jsonUtils.messageToJson(message, chat, sender)
        }, tenant);
        hub_1.sendNotification(chat, sender.alias, 'message', owner);
    });
}
exports.receiveNonKeysend = receiveNonKeysend;
//# sourceMappingURL=regular.js.map