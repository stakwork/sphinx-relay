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
const hub_1 = require("../hub");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const helpers = require("../helpers");
const res_1 = require("../utils/res");
const lightning = require("../utils/lightning");
const ldat_1 = require("../utils/ldat");
const constants = require("../../config/constants.json");
const network = require("../network");
const sendPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, chat_id, contact_id, destination_key, media_type, muid, text, remote_text, dimensions, remote_text_map, contact_ids, } = req.body;
    console.log('[send payment]', req.body);
    if (destination_key && !contact_id && !chat_id) {
        return helpers.performKeysendMessage({
            destination_key,
            amount,
            msg: {},
            success: () => {
                console.log('payment sent!');
                res_1.success(res, { destination_key, amount });
            },
            failure: (error) => {
                res.status(200);
                res.json({ success: false, error });
                res.end();
            }
        });
    }
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id
    });
    var date = new Date();
    date.setMilliseconds(0);
    const msg = {
        chatId: chat.id,
        sender: owner.id,
        type: constants.message_types.direct_payment,
        amount: amount,
        amountMsat: parseFloat(amount) * 1000,
        date: date,
        createdAt: date,
        updatedAt: date
    };
    if (text)
        msg.messageContent = text;
    if (remote_text)
        msg.remoteMessageContent = remote_text;
    if (muid) {
        const myMediaToken = yield ldat_1.tokenFromTerms({
            meta: { dim: dimensions }, host: '',
            muid, ttl: null,
            pubkey: owner.publicKey
        });
        msg.mediaToken = myMediaToken;
        msg.mediaType = media_type || '';
    }
    const message = yield models_1.models.Message.create(msg);
    const msgToSend = {
        id: message.id,
        amount,
    };
    if (muid) {
        msgToSend.mediaType = media_type || 'image/jpeg';
        msgToSend.mediaTerms = { muid, meta: { dim: dimensions } };
    }
    if (remote_text)
        msgToSend.content = remote_text;
    // if contact_ids, replace that in "chat" below
    // if remote text map, put that in
    let theChat = chat;
    if (contact_ids) {
        theChat = Object.assign(Object.assign({}, chat.dataValues), { contactIds: contact_ids });
        if (remote_text_map)
            msgToSend.content = remote_text_map;
    }
    network.sendMessage({
        chat: theChat,
        sender: owner,
        type: constants.message_types.direct_payment,
        message: msgToSend,
        amount: amount,
        success: (data) => __awaiter(void 0, void 0, void 0, function* () {
            // console.log('payment sent', { data })
            res_1.success(res, jsonUtils.messageToJson(message, chat));
        }),
        failure: (error) => __awaiter(void 0, void 0, void 0, function* () {
            yield message.update({ status: constants.statuses.failed });
            res.status(200);
            res.json({
                success: false,
                response: jsonUtils.messageToJson(message, chat)
            });
            res.end();
        })
    });
});
exports.sendPayment = sendPayment;
const receivePayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('received payment', { payload });
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, amount, content, mediaType, mediaToken, chat_type, sender_alias } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const msg = {
        chatId: chat.id,
        type: constants.message_types.direct_payment,
        sender: sender.id,
        amount: amount,
        amountMsat: parseFloat(amount) * 1000,
        date: date,
        createdAt: date,
        updatedAt: date
    };
    if (content)
        msg.messageContent = content;
    if (mediaType)
        msg.mediaType = mediaType;
    if (mediaToken)
        msg.mediaToken = mediaToken;
    if (chat_type === constants.chat_types.tribe) {
        msg.senderAlias = sender_alias;
    }
    const message = yield models_1.models.Message.create(msg);
    console.log('saved message', message.dataValues);
    socket.sendJson({
        type: 'direct_payment',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
    hub_1.sendNotification(chat, msg.senderAlias || sender.alias, 'message');
});
exports.receivePayment = receivePayment;
const listPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = (req.query.limit && parseInt(req.query.limit)) || 100;
    const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
    const payments = [];
    const invs = yield lightning.listAllInvoices();
    if (invs && invs.length) {
        invs.forEach(inv => {
            const val = inv.value && parseInt(inv.value);
            if (val && val > 1) {
                let payment_hash = '';
                if (inv.r_hash) {
                    payment_hash = Buffer.from(inv.r_hash).toString('hex');
                }
                payments.push({
                    type: 'invoice',
                    amount: parseInt(inv.value),
                    date: parseInt(inv.creation_date),
                    payment_request: inv.payment_request,
                    payment_hash
                });
            }
        });
    }
    const pays = yield lightning.listAllPayments();
    if (pays && pays.length) {
        pays.forEach(pay => {
            const val = pay.value && parseInt(pay.value);
            if (val && val > 1) {
                payments.push({
                    type: 'payment',
                    amount: parseInt(pay.value),
                    date: parseInt(pay.creation_date),
                    pubkey: pay.path[pay.path.length - 1],
                    payment_hash: pay.payment_hash,
                });
            }
        });
    }
    // latest one first
    payments.sort((a, b) => b.date - a.date);
    res_1.success(res, payments.splice(offset, limit));
});
exports.listPayments = listPayments;
//# sourceMappingURL=payment.js.map