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
const lightning_1 = require("../utils/lightning");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const decodeUtils = require("../utils/decode");
const helpers = require("../helpers");
const hub_1 = require("../hub");
const res_1 = require("../utils/res");
const confirmations_1 = require("./confirmations");
const path = require("path");
const network = require("../network");
const short = require("short-uuid");
const constants = require(path.join(__dirname, '../../config/constants.json'));
function stripLightningPrefix(s) {
    if (s.toLowerCase().startsWith('lightning:'))
        return s.substring(10);
    return s;
}
exports.payInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lightning = yield lightning_1.loadLightning();
    const payment_request = stripLightningPrefix(req.body.payment_request);
    if (!payment_request) {
        console.log('[pay invoice] "payment_request" is empty');
        res.status(400);
        res.json({ success: false, error: 'payment_request is empty' });
        res.end();
        return;
    }
    console.log(`[pay invoice] ${payment_request}`);
    var call = lightning.sendPayment({});
    call.on('data', (response) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[pay invoice data]', response);
        const message = yield models_1.models.Message.findOne({ where: { payment_request } });
        if (!message) { // invoice still paid
            return res_1.success(res, {
                success: true,
                response: { payment_request }
            });
        }
        message.status = constants.statuses.confirmed;
        message.save();
        var date = new Date();
        date.setMilliseconds(0);
        const chat = yield models_1.models.Chat.findOne({ where: { id: message.chatId } });
        const contactIds = JSON.parse(chat.contactIds);
        const senderId = contactIds.find(id => id != message.sender);
        const paidMessage = yield models_1.models.Message.create({
            chatId: message.chatId,
            sender: senderId,
            type: constants.message_types.payment,
            amount: message.amount,
            amountMsat: message.amountMsat,
            paymentHash: message.paymentHash,
            date: date,
            expirationDate: null,
            messageContent: null,
            status: constants.statuses.confirmed,
            createdAt: date,
            updatedAt: date
        });
        console.log('[pay invoice] stored message', paidMessage);
        res_1.success(res, jsonUtils.messageToJson(paidMessage, chat));
    }));
    call.write({ payment_request });
});
exports.cancelInvoice = (req, res) => {
    res.status(200);
    res.json({ success: false });
    res.end();
};
exports.createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lightning = yield lightning_1.loadLightning();
    const { amount, memo, remote_memo, chat_id, contact_id, expiry, } = req.body;
    var request = {
        value: amount,
        memo: remote_memo || memo
    };
    if (expiry)
        request.expiry = expiry;
    if (amount == null) {
        res.status(200);
        res.json({ err: "no amount specified", });
        res.end();
    }
    else {
        lightning.addInvoice(request, function (err, response) {
            console.log({ err, response });
            if (err == null) {
                const { payment_request } = response;
                if (!contact_id && !chat_id) { // if no contact
                    res_1.success(res, {
                        invoice: payment_request
                    });
                    return; // end here
                }
                lightning.decodePayReq({ pay_req: payment_request }, (error, invoice) => __awaiter(this, void 0, void 0, function* () {
                    if (res) {
                        console.log('decoded pay req', { invoice });
                        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
                        const chat = yield helpers.findOrCreateChat({
                            chat_id,
                            owner_id: owner.id,
                            recipient_id: contact_id
                        });
                        let timestamp = parseInt(invoice.timestamp + '000');
                        let expiry = parseInt(invoice.expiry + '000');
                        if (error) {
                            res.status(200);
                            res.json({ success: false, error });
                            res.end();
                        }
                        else {
                            const message = yield models_1.models.Message.create({
                                chatId: chat.id,
                                uuid: short.generate(),
                                sender: owner.id,
                                type: constants.message_types.invoice,
                                amount: parseInt(invoice.num_satoshis),
                                amountMsat: parseInt(invoice.num_satoshis) * 1000,
                                paymentHash: invoice.payment_hash,
                                paymentRequest: payment_request,
                                date: new Date(timestamp),
                                expirationDate: new Date(timestamp + expiry),
                                messageContent: memo,
                                remoteMessageContent: remote_memo,
                                status: constants.statuses.pending,
                                createdAt: new Date(timestamp),
                                updatedAt: new Date(timestamp)
                            });
                            res_1.success(res, jsonUtils.messageToJson(message, chat));
                            network.sendMessage({
                                chat: chat,
                                sender: owner,
                                type: constants.message_types.invoice,
                                message: {
                                    id: message.id,
                                    invoice: message.paymentRequest
                                }
                            });
                        }
                    }
                    else {
                        console.log('error decoding pay req', { err, res });
                        res.status(500);
                        res.json({ err, res });
                        res.end();
                    }
                }));
            }
            else {
                console.log({ err, response });
            }
        });
    }
});
exports.listInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lightning = yield lightning_1.loadLightning();
    lightning.listInvoices({}, (err, response) => {
        console.log({ err, response });
        if (err == null) {
            res.status(200);
            res.json(response);
            res.end();
        }
        else {
            console.log({ err, response });
        }
    });
});
exports.receiveInvoice = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('received invoice', payload);
    const total_spent = 1;
    const dat = payload.content || payload;
    const payment_request = dat.message.invoice;
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, msg_id, chat_type, sender_alias, msg_uuid } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const { memo, sat, msat, paymentHash, invoiceDate, expirationSeconds } = decodePaymentRequest(payment_request);
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants.message_types.invoice,
        sender: sender.id,
        amount: sat,
        amountMsat: msat,
        paymentRequest: payment_request,
        asciiEncodedTotal: total_spent,
        paymentHash: paymentHash,
        messageContent: memo,
        expirationDate: new Date(invoiceDate + expirationSeconds),
        date: new Date(invoiceDate),
        status: constants.statuses.pending,
        createdAt: date,
        updatedAt: date
    };
    const isTribe = chat_type === constants.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
    }
    const message = yield models_1.models.Message.create(msg);
    console.log('received keysend invoice message', message.id);
    socket.sendJson({
        type: 'invoice',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
    hub_1.sendNotification(chat, msg.senderAlias || sender.alias, 'message');
    const theChat = Object.assign(Object.assign({}, chat.dataValues), { contactIds: [sender.id] });
    confirmations_1.sendConfirmation({ chat: theChat, sender: owner, msg_id });
});
// lnd invoice stuff
function decodePaymentRequest(paymentRequest) {
    var decodedPaymentRequest = decodeUtils.decode(paymentRequest);
    var expirationSeconds = 3600;
    var paymentHash = "";
    var memo = "";
    for (var i = 0; i < decodedPaymentRequest.data.tags.length; i++) {
        let tag = decodedPaymentRequest.data.tags[i];
        if (tag) {
            if (tag.description == 'payment_hash') {
                paymentHash = tag.value;
            }
            else if (tag.description == 'description') {
                memo = tag.value;
            }
            else if (tag.description == 'expiry') {
                expirationSeconds = tag.value;
            }
        }
    }
    expirationSeconds = parseInt(expirationSeconds.toString() + '000');
    let invoiceDate = parseInt(decodedPaymentRequest.data.time_stamp.toString() + '000');
    let amount = decodedPaymentRequest['human_readable_part']['amount'];
    var msat = 0;
    var sat = 0;
    if (Number.isInteger(amount)) {
        msat = amount;
        sat = amount / 1000;
    }
    return { sat, msat, paymentHash, invoiceDate, expirationSeconds, memo };
}
//# sourceMappingURL=invoices.js.map