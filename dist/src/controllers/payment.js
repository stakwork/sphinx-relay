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
const ldat_1 = require("../utils/ldat");
const network = require("../network");
const short = require("short-uuid");
const constants_1 = require("../constants");
const sequelize_1 = require("sequelize");
const feed_1 = require("./feed");
exports.sendPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, chat_id, contact_id, destination_key, media_type, muid, text, remote_text, dimensions, remote_text_map, contact_ids, reply_uuid, } = req.body;
    console.log('[send payment]', req.body);
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    if (destination_key && !contact_id && !chat_id) {
        feed_1.anonymousKeysend(owner, destination_key, amount || '', text || '', function (body) {
            res_1.success(res, body);
        }, function (error) {
            res.status(200);
            res.json({ success: false, error });
            res.end();
        });
        return;
    }
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id
    });
    var date = new Date();
    date.setMilliseconds(0);
    const msg = {
        chatId: chat.id,
        uuid: short.generate(),
        sender: owner.id,
        type: constants_1.default.message_types.direct_payment,
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
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
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
        uuid: message.uuid,
        amount,
    };
    if (muid) {
        msgToSend.mediaType = media_type || 'image/jpeg';
        msgToSend.mediaTerms = { muid, meta: { dim: dimensions } };
    }
    if (remote_text)
        msgToSend.content = remote_text;
    if (reply_uuid)
        msgToSend.replyUuid = reply_uuid;
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
        type: constants_1.default.message_types.direct_payment,
        message: msgToSend,
        amount: amount,
        success: (data) => __awaiter(void 0, void 0, void 0, function* () {
            // console.log('payment sent', { data })
            res_1.success(res, jsonUtils.messageToJson(message, chat));
        }),
        failure: (error) => __awaiter(void 0, void 0, void 0, function* () {
            yield message.update({ status: constants_1.default.statuses.failed });
            res.status(200);
            res.json({
                success: false,
                response: jsonUtils.messageToJson(message, chat)
            });
            res.end();
        })
    });
});
exports.receivePayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('received payment', { payload });
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, amount, content, mediaType, mediaToken, chat_type, sender_alias, msg_uuid, reply_uuid } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.direct_payment,
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
    if (chat_type === constants_1.default.chat_types.tribe) {
        msg.senderAlias = sender_alias;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    const message = yield models_1.models.Message.create(msg);
    // console.log('saved message', message.dataValues)
    socket.sendJson({
        type: 'direct_payment',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
    hub_1.sendNotification(chat, msg.senderAlias || sender.alias, 'message');
});
exports.listPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = (req.query.limit && parseInt(req.query.limit)) || 100;
    const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
    // const MIN_VAL=constants.min_sat_amount
    try {
        const msgs = yield models_1.models.Message.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    {
                        type: { [sequelize_1.Op.or]: [
                                constants_1.default.message_types.payment,
                                constants_1.default.message_types.direct_payment,
                                constants_1.default.message_types.keysend,
                            ] }
                    },
                ],
            },
            order: [['createdAt', 'desc']],
            limit,
            offset
        });
        const ret = msgs || [];
        res_1.success(res, ret.map(message => jsonUtils.messageToJson(message, null)));
    }
    catch (e) {
        res_1.failure(res, 'cant find payments');
    }
});
//# sourceMappingURL=payment.js.map