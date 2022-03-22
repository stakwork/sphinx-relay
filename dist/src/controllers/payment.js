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
exports.listPayments = exports.receivePayment = exports.sendPayment = void 0;
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
const logger_1 = require("../utils/logger");
const sendPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const { amount, chat_id, contact_id, destination_key, route_hint, media_type, muid, text, remote_text, dimensions, remote_text_map, contact_ids, reply_uuid, parent_id, } = req.body;
    logger_1.sphinxLogger.info(`[send payment] ${req.body}`);
    const owner = req.owner;
    if (destination_key && !contact_id && !chat_id) {
        (0, feed_1.anonymousKeysend)(owner, destination_key, route_hint, amount || '', text || '', function (body) {
            (0, res_1.success)(res, body);
        }, function (error) {
            res.status(200);
            res.json({ success: false, error });
            res.end();
        }, {});
        return;
    }
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id,
    });
    if (!chat)
        return (0, res_1.failure)(res, 'counldnt findOrCreateChat');
    const date = new Date();
    date.setMilliseconds(0);
    const msg = {
        chatId: chat.id,
        uuid: short.generate(),
        sender: owner.id,
        type: constants_1.default.message_types.direct_payment,
        status: constants_1.default.statuses.confirmed,
        amount: amount,
        amountMsat: parseFloat(amount) * 1000,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type: constants_1.default.network_types.lightning,
        tenant,
    };
    if (text)
        msg.messageContent = text;
    if (remote_text)
        msg.remoteMessageContent = remote_text;
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    if (muid) {
        const myMediaToken = yield (0, ldat_1.tokenFromTerms)({
            meta: { dim: dimensions },
            host: '',
            muid,
            ttl: null,
            pubkey: owner.publicKey,
            ownerPubkey: owner.publicKey,
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
    if (parent_id)
        msgToSend.parentId = parent_id;
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
            (0, res_1.success)(res, jsonUtils.messageToJson(message, chat));
        }),
        failure: (error) => __awaiter(void 0, void 0, void 0, function* () {
            yield message.update({ status: constants_1.default.statuses.failed });
            res.status(200);
            res.json({
                success: false,
                response: jsonUtils.messageToJson(message, chat),
            });
            res.end();
        }),
    });
});
exports.sendPayment = sendPayment;
const receivePayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info(`received payment ${{ payload }}`);
    const date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, amount, content, mediaType, mediaToken, chat_type, sender_alias, msg_uuid, reply_uuid, parent_id, network_type, sender_photo_url, } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error(`=> no group chat!`);
    }
    const tenant = owner.id;
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.direct_payment,
        status: constants_1.default.statuses.received,
        sender: sender.id,
        amount: amount,
        amountMsat: parseFloat(amount + '') * 1000,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
    };
    if (content)
        msg.messageContent = content;
    if (mediaType)
        msg.mediaType = mediaType;
    if (mediaToken)
        msg.mediaToken = mediaToken;
    if (chat_type === constants_1.default.chat_types.tribe) {
        msg.senderAlias = sender_alias;
        msg.senderPic = sender_photo_url;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    const message = yield models_1.models.Message.create(msg);
    // console.log('saved message', message.dataValues)
    socket.sendJson({
        type: 'direct_payment',
        response: jsonUtils.messageToJson(message, chat, sender),
    }, tenant);
    (0, hub_1.sendNotification)(chat, msg.senderAlias || sender.alias, 'message', owner);
});
exports.receivePayment = receivePayment;
const listPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const limit = (req.query.limit && parseInt(req.query.limit.toString())) || 100;
    const offset = (req.query.offset && parseInt(req.query.offset.toString())) || 0;
    const MIN_VAL = constants_1.default.min_sat_amount;
    try {
        const msgs = yield models_1.models.Message.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    {
                        type: {
                            [sequelize_1.Op.or]: [
                                constants_1.default.message_types.payment,
                                constants_1.default.message_types.direct_payment,
                                constants_1.default.message_types.keysend,
                                constants_1.default.message_types.purchase,
                            ],
                        },
                        status: { [sequelize_1.Op.not]: constants_1.default.statuses.failed },
                    },
                    {
                        type: {
                            [sequelize_1.Op.or]: [
                                constants_1.default.message_types.message,
                                constants_1.default.message_types.boost,
                                constants_1.default.message_types.repayment,
                            ],
                        },
                        amount: {
                            [sequelize_1.Op.gt]: MIN_VAL, // greater than
                        },
                        network_type: constants_1.default.network_types.lightning,
                        status: { [sequelize_1.Op.not]: constants_1.default.statuses.failed },
                    },
                ],
                tenant,
            },
            order: [['createdAt', 'desc']],
            limit,
            offset,
        });
        const ret = msgs || [];
        (0, res_1.success)(res, ret.map((message) => jsonUtils.messageToJson(message)));
    }
    catch (e) {
        (0, res_1.failure)(res, 'cant find payments');
    }
});
exports.listPayments = listPayments;
//# sourceMappingURL=payment.js.map