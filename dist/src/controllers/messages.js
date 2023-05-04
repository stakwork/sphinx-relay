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
exports.initializeDeleteMessageCronJobs = exports.receiveVoip = exports.disappearingMessages = exports.clearMessages = exports.readMessages = exports.receiveDeleteMessage = exports.receiveRepayment = exports.receiveBoost = exports.receiveMessage = exports.sendMessage = exports.deleteMessage = exports.getMsgs = exports.getAllMessages = exports.getMessages = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const underscore_1 = require("underscore");
const hub_1 = require("../hub");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const helpers = require("../helpers");
const res_1 = require("../utils/res");
const timers = require("../utils/timers");
const confirmations_1 = require("./confirmations");
const network = require("../network");
const short = require("short-uuid");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
const tribes_1 = require("../utils/tribes");
const cron_1 = require("cron");
const config_1 = require("../utils/config");
// store all current running jobs in memory
const jobs = {};
const config = (0, config_1.loadConfig)();
// deprecated
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const dateToReturn = req.query.date;
    if (!dateToReturn) {
        return (0, exports.getAllMessages)(req, res);
    }
    logger_1.sphinxLogger.info(dateToReturn, logger_1.logging.Express);
    const owner = req.owner;
    // const chatId = req.query.chat_id
    const newMessagesWhere = {
        date: { [sequelize_1.Op.gte]: dateToReturn },
        [sequelize_1.Op.or]: [{ receiver: owner.id }, { receiver: null }],
        tenant,
    };
    const confirmedMessagesWhere = {
        updated_at: { [sequelize_1.Op.gte]: dateToReturn },
        status: {
            [sequelize_1.Op.or]: [constants_1.default.statuses.received],
        },
        sender: owner.id,
        tenant,
    };
    const deletedMessagesWhere = {
        updated_at: { [sequelize_1.Op.gte]: dateToReturn },
        status: {
            [sequelize_1.Op.or]: [constants_1.default.statuses.deleted],
        },
        tenant,
    };
    // if (chatId) {
    // 	newMessagesWhere.chat_id = chatId
    // 	confirmedMessagesWhere.chat_id = chatId
    // }
    const newMessages = (yield models_1.models.Message.findAll({
        where: newMessagesWhere,
    }));
    const confirmedMessages = (yield models_1.models.Message.findAll({
        where: confirmedMessagesWhere,
    }));
    const deletedMessages = (yield models_1.models.Message.findAll({
        where: deletedMessagesWhere,
    }));
    const chatIds = [];
    newMessages.forEach((m) => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    confirmedMessages.forEach((m) => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    deletedMessages.forEach((m) => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    const chats = chatIds.length > 0
        ? (yield models_1.models.Chat.findAll({
            where: { deleted: false, id: chatIds, tenant },
        }))
        : [];
    const chatsById = (0, underscore_1.indexBy)(chats, 'id');
    res.json({
        success: true,
        response: {
            new_messages: newMessages.map((message) => jsonUtils.messageToJson(message, chatsById[message.chatId])),
            confirmed_messages: confirmedMessages.map((message) => jsonUtils.messageToJson(message, chatsById[message.chatId])),
            deleted_messages: deletedMessages.map((message) => jsonUtils.messageToJson(message, chatsById[message.chatId])),
        },
    });
    res.status(200);
    res.end();
});
exports.getMessages = getMessages;
/**
@async
@function getAllMessages
@param {Req} req - The request object
@param {Res} res - The response object
@returns {Promise<void>}
@description This function retrieves all messages for the current owner, along with metadata about the messages, such as the associated chat ID and the total number of messages.
*/
const getAllMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const limit = (req.query.limit && parseInt(req.query.limit)) || 1000;
    const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
    let order = 'asc';
    if (req.query.order && req.query.order === 'desc') {
        order = 'desc';
    }
    logger_1.sphinxLogger.info(`=> getAllMessages, limit: ${limit}, offset: ${offset}`, logger_1.logging.Express);
    const clause = {
        order: [['id', order]],
        where: { tenant },
    };
    const all_messages_length = (yield models_1.models.Message.count(clause));
    if (limit) {
        clause.limit = limit;
        clause.offset = offset;
    }
    const messages = (yield models_1.models.Message.findAll(clause));
    logger_1.sphinxLogger.info(`=> got msgs, ${messages && messages.length}`, logger_1.logging.Express);
    const chats = (yield models_1.models.Chat.findAll({
        where: { deleted: false, tenant },
    }));
    // Get Cache Messages
    const checkCache = helpers.checkCache();
    const allMsg = checkCache
        ? yield getFromCache({
            chats,
            order,
            offset,
            limit,
            messages,
            all_messages_length,
        })
        : { messages, all_messages_length };
    // console.log("=> found all chats", chats && chats.length);
    const chatsById = (0, underscore_1.indexBy)(chats, 'id');
    // console.log("=> indexed chats");
    (0, res_1.success)(res, {
        new_messages: allMsg.messages.map((message) => jsonUtils.messageToJson(message, chatsById[message.chatId])),
        new_messages_total: allMsg.all_messages_length,
        confirmed_messages: [],
    });
});
exports.getAllMessages = getAllMessages;
/**
@function
@async
@param {Req} req - Express request object.
@param {Res} res - Express response object.
@returns {Promise<void>}
@description
This route handler is used to retrieve new messages. It accepts two optional query parameters: limit and offset
to limit the number of messages returned, and date to retrieve messages updated after the specified date.
The response contains the new_messages array, which is an array of new messages, and the new_messages_total
property, which indicates the total number of new messages.
*/
const getMsgs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const limit = req.query.limit && parseInt(req.query.limit);
    const offset = req.query.offset && parseInt(req.query.offset);
    const dateToReturn = req.query.date;
    if (!dateToReturn) {
        return (0, exports.getAllMessages)(req, res);
    }
    logger_1.sphinxLogger.info(`=> getMsgs, limit: ${limit}, offset: ${offset}`, logger_1.logging.Express);
    let order = 'asc';
    if (req.query.order && req.query.order === 'desc') {
        order = 'desc';
    }
    const clause = {
        order: [['id', order]],
        where: {
            updated_at: { [sequelize_1.Op.gte]: dateToReturn },
            tenant,
        },
    };
    const numberOfNewMessages = (yield models_1.models.Message.count(clause));
    if (limit) {
        clause.limit = limit;
        clause.offset = offset;
    }
    const messages = (yield models_1.models.Message.findAll(clause));
    logger_1.sphinxLogger.info(`=> got msgs, ${messages && messages.length}`, logger_1.logging.Express);
    const chats = (yield models_1.models.Chat.findAll({
        where: { deleted: false, tenant },
    }));
    //Check Cache
    const checkCache = helpers.checkCache();
    const allMsg = checkCache
        ? yield getFromCache({
            chats,
            order,
            offset,
            limit,
            messages,
            all_messages_length: numberOfNewMessages,
            dateToReturn,
        })
        : { messages, all_messages_length: numberOfNewMessages };
    const chatsById = (0, underscore_1.indexBy)(chats, 'id');
    (0, res_1.success)(res, {
        new_messages: allMsg.messages.map((message) => jsonUtils.messageToJson(message, chatsById[message.chatId])),
        new_messages_total: allMsg.all_messages_length,
    });
});
exports.getMsgs = getMsgs;
/**
Deletes a message from the database and sends a delete message to the chat.
@param {Req} req - The request object containing the owner and params.
@param {Res} res - The response object to send the result.
@returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
*/
function deleteMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const id = parseInt(req.params.id);
        const message = (yield models_1.models.Message.findOne({
            where: { id, tenant },
        }));
        const uuid = message.uuid;
        yield message.update({ status: constants_1.default.statuses.deleted });
        const chat_id = message.chatId;
        let chat;
        if (chat_id) {
            chat = yield models_1.models.Chat.findOne({ where: { id: chat_id, tenant } });
        }
        (0, res_1.success)(res, jsonUtils.messageToJson(message, chat));
        if (!chat) {
            return (0, res_1.failure)(res, 'no Chat');
        }
        const isTribe = chat.type === constants_1.default.chat_types.tribe;
        const owner = req.owner;
        const isTribeOwner = isTribe && owner.publicKey === chat.ownerPubkey;
        if (isTribeOwner) {
            timers.removeTimerByMsgId(id);
        }
        network.sendMessage({
            chat: chat,
            sender: owner,
            type: constants_1.default.message_types.delete,
            message: { id, uuid },
        });
    });
}
exports.deleteMessage = deleteMessage;
/**
send a message to a contact or tribe

@param {Req} req - request object
@param {Res} res - response object

@return {Promise<void>}
*/
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    // try {
    // 	schemas.message.validateSync(req.body)
    // } catch(e) {
    // 	return failure(res, e.message)
    // }
    const { contact_id, text, remote_text, chat_id, remote_text_map, amount, reply_uuid, boost, message_price, parent_id, pay, call, } = req.body;
    let msgtype = constants_1.default.message_types.message;
    if (boost)
        msgtype = constants_1.default.message_types.boost;
    if (pay)
        msgtype = constants_1.default.message_types.direct_payment;
    if (call)
        msgtype = constants_1.default.message_types.call;
    let boostOrPay = false;
    if (boost || pay)
        boostOrPay = true;
    const date = new Date();
    date.setMilliseconds(0);
    const owner = req.owner;
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id,
    });
    if (!chat)
        return (0, res_1.failure)(res, 'counldnt findOrCreateChat');
    let realSatsContactId;
    let recipientAlias;
    let recipientPic;
    // IF BOOST NEED TO SEND ACTUAL SATS TO OG POSTER
    if (!chat) {
        return (0, res_1.failure)(res, 'no Chat');
    }
    const isTribe = chat.type === constants_1.default.chat_types.tribe;
    const isTribeOwner = isTribe && owner.publicKey === chat.ownerPubkey;
    if (reply_uuid && boostOrPay && amount) {
        const ogMsg = (yield models_1.models.Message.findOne({
            where: {
                uuid: reply_uuid,
                tenant,
            },
        }));
        if (ogMsg && ogMsg.sender) {
            realSatsContactId = ogMsg.sender;
            if (pay) {
                recipientAlias = ogMsg.senderAlias;
                recipientPic = ogMsg.senderPic;
            }
        }
    }
    const hasRealAmount = amount && amount > constants_1.default.min_sat_amount;
    const remoteMessageContent = remote_text_map
        ? JSON.stringify(remote_text_map)
        : remote_text;
    const uuid = short.generate();
    let amtToStore = amount || 0;
    if (boostOrPay &&
        message_price &&
        typeof message_price === 'number' &&
        amount &&
        message_price < amount) {
        amtToStore = amount - message_price;
    }
    const msg = {
        chatId: chat.id,
        uuid: uuid,
        type: msgtype,
        sender: owner.id,
        amount: amtToStore,
        date: date,
        messageContent: text,
        remoteMessageContent,
        status: constants_1.default.statuses.pending,
        createdAt: date,
        updatedAt: date,
        network_type: !isTribe || hasRealAmount || realSatsContactId
            ? constants_1.default.network_types.lightning
            : constants_1.default.network_types.mqtt,
        tenant,
    };
    // "pay" someone who sent a msg is not a reply
    if (reply_uuid && !pay)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    if (recipientAlias)
        msg.recipientAlias = recipientAlias;
    if (recipientPic)
        msg.recipientPic = recipientPic;
    // console.log(msg)
    const message = (yield models_1.models.Message.create(msg));
    (0, res_1.success)(res, jsonUtils.messageToJson(message, chat));
    const msgToSend = {
        id: message.id,
        uuid: message.uuid,
        content: remote_text_map || remote_text || text,
        amount: amtToStore,
    };
    // even if its a "pay" send the reply_uuid so admin can forward
    if (reply_uuid) {
        // unless YOU are admin, then there is no forwarding
        if (!(isTribeOwner && pay)) {
            msgToSend.replyUuid = reply_uuid;
        }
    }
    if (parent_id)
        msgToSend.parentId = parent_id;
    if (recipientAlias)
        msgToSend.recipientAlias = recipientAlias;
    if (recipientPic)
        msgToSend.recipientPic = recipientPic;
    const sendMessageParams = {
        chat: chat,
        sender: owner,
        amount: amount || 0,
        type: msgtype,
        message: msgToSend,
    };
    if (isTribeOwner && realSatsContactId) {
        sendMessageParams.realSatsContactId = realSatsContactId;
        // tribe owner deducts the "price per message + escrow amount"
        if (amtToStore) {
            sendMessageParams.amount = amtToStore;
        }
    }
    // final send
    // console.log('==> FINAL SEND MSG PARAMS', sendMessageParams)
    network.sendMessage(sendMessageParams);
});
exports.sendMessage = sendMessage;
/**
Receive a message and store it in the database.

@param {Payload} payload - The message payload containing the sender, chat, and message content.
@returns {Promise<void>} - A promise that resolves when the message has been received and stored.
*/
const receiveMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, sender, chat, content, remote_content, msg_id, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, parent_id, amount, network_type, sender_photo_url, message_status, force_push, hasForwardedSats, person, cached, } = yield helpers.parseReceiveParams(payload);
    logger_1.sphinxLogger.info(`received message on tenant ${owner.id} chat ${chat.id}`);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.info('=> no group chat!');
    }
    const tenant = owner.id;
    const text = content || '';
    let date = new Date();
    date.setMilliseconds(0);
    if (date_string)
        date = new Date(date_string);
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.message,
        sender: sender.id,
        date: date,
        amount: amount || 0,
        messageContent: text,
        createdAt: date,
        updatedAt: date,
        status: message_status || constants_1.default.statuses.received,
        network_type: network_type,
        tenant,
        forwardedSats: hasForwardedSats,
        push: force_push ? true : false,
    };
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        msg.senderPic = sender_photo_url;
        msg.person = person;
        if (remote_content)
            msg.remoteMessageContent = remote_content;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    let message = null;
    if (!cached) {
        message = (yield models_1.models.Message.create(msg));
    }
    socket.sendJson({
        type: 'message',
        response: jsonUtils.messageToJson(message || msg, chat, sender),
    }, tenant);
    (0, hub_1.sendNotification)(chat, (msg.senderAlias || sender.alias), 'message', owner, undefined, force_push);
    if (!cached) {
        (0, confirmations_1.sendConfirmation)({ chat, sender: owner, msg_id, receiver: sender });
    }
});
exports.receiveMessage = receiveMessage;
/**
Receives a boost message and stores it in the database.
@param {Payload} payload - The boost message payload.
@return {Promise<void>} - A promise that resolves when the function completes.
*/
const receiveBoost = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, sender, chat, content, remote_content, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, parent_id, amount, network_type, sender_photo_url, msg_id, force_push, hasForwardedSats, cached, } = yield helpers.parseReceiveParams(payload);
    logger_1.sphinxLogger.info(`=> received boost ${amount} sats on network: ${network_type}`, logger_1.logging.Network);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    const text = content;
    let date = new Date();
    date.setMilliseconds(0);
    if (date_string)
        date = new Date(date_string);
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.boost,
        sender: sender.id,
        date: date,
        amount: amount || 0,
        messageContent: text,
        createdAt: date,
        updatedAt: date,
        status: constants_1.default.statuses.received,
        network_type,
        tenant,
        forwardedSats: hasForwardedSats,
    };
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        msg.senderPic = sender_photo_url;
        if (remote_content)
            msg.remoteMessageContent = remote_content;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    let message = null;
    if (!cached) {
        message = (yield models_1.models.Message.create(msg));
    }
    socket.sendJson({
        type: 'boost',
        response: jsonUtils.messageToJson(message || msg, chat, sender),
    }, tenant);
    if (!cached) {
        (0, confirmations_1.sendConfirmation)({ chat, sender: owner, msg_id, receiver: sender });
    }
    if (msg.replyUuid) {
        const ogMsg = (yield models_1.models.Message.findOne({
            where: { uuid: msg.replyUuid, tenant },
        }));
        if (ogMsg && ogMsg.sender === tenant) {
            (0, hub_1.sendNotification)(chat, (msg.senderAlias || sender.alias), 'boost', owner, undefined, force_push);
        }
    }
});
exports.receiveBoost = receiveBoost;
/**
Handles the receipt of a repayment.

@param {Payload} payload - The parsed payload of the incoming message.
@returns {Promise<void>} - A promise that resolves when the receipt of the repayment has been processed.
*/
const receiveRepayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, sender, chat, date_string, amount, network_type } = yield helpers.parseReceiveParams(payload);
    logger_1.sphinxLogger.info(`=> received repayment ${amount}sats`, logger_1.logging.Network);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    let date = new Date();
    date.setMilliseconds(0);
    if (date_string)
        date = new Date(date_string);
    const message = (yield models_1.models.Message.create({
        // chatId: chat.id,
        type: constants_1.default.message_types.repayment,
        sender: sender.id,
        date: date,
        amount: amount || 0,
        createdAt: date,
        updatedAt: date,
        status: constants_1.default.statuses.received,
        network_type,
        tenant,
    }));
    socket.sendJson({
        type: 'repayment',
        response: jsonUtils.messageToJson(message, null, sender),
    }, tenant);
});
exports.receiveRepayment = receiveRepayment;
/**
@async
@function receiveDeleteMessage
@param {Payload} payload - The payload object containing information about the deleted message.
@returns {Promise<void>}
@example
receiveDeleteMessage(payload)
*/
const receiveDeleteMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info('=> received delete message', logger_1.logging.Network);
    const { owner, sender, chat, chat_type, msg_uuid } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    // in tribe this is already validated on admin's node
    const where = { uuid: msg_uuid, tenant };
    if (!isTribe) {
        where.sender = sender.id; // validate sender
    }
    const message = (yield models_1.models.Message.findOne({ where }));
    if (!message)
        return;
    yield message.update({ status: constants_1.default.statuses.deleted });
    socket.sendJson({
        type: 'delete',
        response: jsonUtils.messageToJson(message, chat, sender),
    }, tenant);
});
exports.receiveDeleteMessage = receiveDeleteMessage;
/**
Updates the messages in the specified chat to mark them as seen by the owner and sends a notification to the other chat members.

@param {Req} req - The request object containing the chat ID.
@param {Res} res - The response object used to send the updated chat information.
@returns {Promise<void>} - An empty promise.
*/
const readMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const chat_id = req.params.chat_id;
    const owner = req.owner;
    const tenant = owner.id;
    yield models_1.models.Message.update({ seen: true }, {
        where: {
            sender: {
                [sequelize_1.Op.ne]: owner.id,
            },
            chatId: chat_id,
            [sequelize_1.Op.or]: [{ seen: false }, { seen: null }],
            tenant,
        },
    });
    const chat = (yield models_1.models.Chat.findOne({
        where: { id: chat_id, tenant },
    }));
    if (chat) {
        (0, hub_1.resetNotifyTribeCount)(parseInt(chat_id));
        yield chat.update({ seen: true });
        (0, res_1.success)(res, {});
        (0, hub_1.sendNotification)(chat, '', 'badge', owner);
        socket.sendJson({
            type: 'chat_seen',
            response: jsonUtils.chatToJson(chat),
        }, tenant);
    }
    else {
        (0, res_1.failure)(res, 'no chat');
    }
});
exports.readMessages = readMessages;
/**
This function will clear all messages in the database.

@param {Req} req - The request object containing the owner property.
@param {Res} res - The response object.
@returns {Promise<void>} - This function returns a promise that resolves to an empty object on success, or a failure message on failure.
*/
const clearMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    yield models_1.models.Message.destroy({ where: { tenant }, truncate: true });
    (0, res_1.success)(res, {});
});
exports.clearMessages = clearMessages;
function disappearingMessages(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const contacts = (yield models_1.models.Message.findAll({
                where: { tenant, isOwner: true },
            }));
            // await deleteMessages(contacts)
            return (0, res_1.success)(res, contacts);
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.disappearingMessages = disappearingMessages;
const receiveVoip = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info(`received Voip ${payload}`);
    const { owner, sender, chat, content, msg_id, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, parent_id, amount, network_type, sender_photo_url, message_status, hasForwardedSats, person, remote_content, } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.info('=> invalid message');
    }
    const tenant = owner.id;
    const text = content;
    let date = new Date();
    date.setMilliseconds(0);
    if (date_string)
        date = new Date(date_string);
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.call,
        sender: sender.id,
        date: date,
        amount: amount || 0,
        messageContent: text,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
        forwardedSats: hasForwardedSats,
        status: message_status || constants_1.default.statuses.received,
    };
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        msg.senderPic = sender_photo_url;
        if (remote_content)
            msg.remoteMessageContent = remote_content;
        msg.person = person;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    if (parent_id)
        msg.parentId = parent_id;
    const message = (yield models_1.models.Message.create(msg));
    socket.sendJson({
        type: 'call',
        response: jsonUtils.messageToJson(message, chat, sender),
    }, tenant);
    (0, hub_1.sendVoipNotification)(owner, { caller_name: sender.alias, link_url: text });
    (0, confirmations_1.sendConfirmation)({ chat, sender: owner, msg_id, receiver: sender });
});
exports.receiveVoip = receiveVoip;
function getFromCache({ chats, order, offset, limit, messages, all_messages_length, dateToReturn, }) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i];
            if (chat.preview) {
                const cacheMsg = yield (0, tribes_1.getCacheMsg)({
                    preview: chat.preview,
                    chat_uuid: chat.uuid,
                    chat_id: chat.id,
                    order,
                    offset,
                    limit,
                    dateToReturn,
                });
                messages = [...messages, ...cacheMsg];
                all_messages_length = all_messages_length + cacheMsg.length;
            }
        }
        return removeDuplicateMsg(messages, all_messages_length);
    });
}
function removeDuplicateMsg(messages, message_length) {
    const filteredMsg = [];
    const uuidObject = {};
    let all_message_length = message_length;
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const alreadyStoredMsg = uuidObject[message.uuid];
        if (helpers.checkMsgTypeInCache(message.type) &&
            alreadyStoredMsg &&
            !alreadyStoredMsg.chat_id) {
            const msgIndex = filteredMsg.findIndex((msg) => msg.uuid === alreadyStoredMsg.uuid);
            filteredMsg.splice(msgIndex, 1);
            all_message_length -= 1;
            filteredMsg.push(message);
            uuidObject[message.uuid] = message;
        }
        else {
            filteredMsg.push(message);
            uuidObject[message.uuid] = message;
        }
    }
    return { messages: filteredMsg, all_messages_length: all_message_length };
}
const initializeDeleteMessageCronJobs = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (config.default_prune) {
            logger_1.sphinxLogger.info(['=> initializing delete message cron job']);
            const contacts = (yield models_1.models.Contact.findAll({
                where: { isOwner: true },
            }));
            startDeleteMsgCronJob(contacts);
        }
    }
    catch (error) {
        logger_1.sphinxLogger.error(['=> error initializing delete message cron job', error]);
    }
});
exports.initializeDeleteMessageCronJobs = initializeDeleteMessageCronJobs;
function startDeleteMsgCronJob(contacts) {
    return __awaiter(this, void 0, void 0, function* () {
        jobs['del_msg'] = new cron_1.CronJob('0 5 * * *', () => {
            deleteMessages(contacts);
        }, null, true);
    });
}
function deleteMessages(contacts) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (let i = 0; i < contacts.length; i++) {
                const contact = contacts[i];
                const date = new Date();
                date.setDate(date.getDate() - (contact.prune || parseInt(config.default_prune)));
                yield handleMessageDelete({
                    tenant: contact.tenant,
                    date: date.toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error([
                '=> error iterating through contacts to delete message cron job',
                error,
            ]);
        }
    });
}
function handleMessageDelete({ tenant, date, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //select all messages that are in the group chat
            const messages = (yield models_1.models.Message.findAll({
                where: { tenant, createdAt: { [sequelize_1.Op.lt]: date } },
            }));
            //put the chat_id into an objects of array and id's as keys
            const chat_messages = {};
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                chat_messages[message.chatId] = [
                    ...(chat_messages[message.chatId] || []),
                    message,
                ];
            }
            //loop through the chats and delete chat messages that are greater than 10
            for (let key in chat_messages) {
                if (chat_messages[key].length > 10) {
                    const toTeDeleted = chat_messages[key].length - 10;
                    for (let j = 0; j < toTeDeleted; j++) {
                        yield chat_messages[key][j].destroy();
                    }
                }
            }
            logger_1.sphinxLogger.info(['=> message deleted by cron job']);
        }
        catch (error) {
            logger_1.sphinxLogger.error(['=> error deleting message by cron job', error]);
        }
    });
}
//# sourceMappingURL=messages.js.map