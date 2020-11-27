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
exports.getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dateToReturn = req.query.date;
    if (!dateToReturn) {
        return exports.getAllMessages(req, res);
    }
    console.log(dateToReturn);
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    // const chatId = req.query.chat_id
    let newMessagesWhere = {
        date: { [sequelize_1.Op.gte]: dateToReturn },
        [sequelize_1.Op.or]: [
            { receiver: owner.id },
            { receiver: null }
        ]
    };
    let confirmedMessagesWhere = {
        updated_at: { [sequelize_1.Op.gte]: dateToReturn },
        status: { [sequelize_1.Op.or]: [
                constants_1.default.statuses.received,
            ] },
        sender: owner.id
    };
    let deletedMessagesWhere = {
        updated_at: { [sequelize_1.Op.gte]: dateToReturn },
        status: { [sequelize_1.Op.or]: [
                constants_1.default.statuses.deleted
            ] },
    };
    // if (chatId) {
    // 	newMessagesWhere.chat_id = chatId
    // 	confirmedMessagesWhere.chat_id = chatId
    // }
    const newMessages = yield models_1.models.Message.findAll({ where: newMessagesWhere });
    const confirmedMessages = yield models_1.models.Message.findAll({ where: confirmedMessagesWhere });
    const deletedMessages = yield models_1.models.Message.findAll({ where: deletedMessagesWhere });
    const chatIds = [];
    newMessages.forEach(m => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    confirmedMessages.forEach(m => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    deletedMessages.forEach(m => {
        if (!chatIds.includes(m.chatId))
            chatIds.push(m.chatId);
    });
    let chats = chatIds.length > 0 ? yield models_1.models.Chat.findAll({ where: { deleted: false, id: chatIds } }) : [];
    const chatsById = underscore_1.indexBy(chats, 'id');
    res.json({
        success: true,
        response: {
            new_messages: newMessages.map(message => jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])),
            confirmed_messages: confirmedMessages.map(message => jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])),
            deleted_messages: deletedMessages.map(message => jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)]))
        }
    });
    res.status(200);
    res.end();
});
exports.getAllMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = (req.query.limit && parseInt(req.query.limit)) || 1000;
    const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
    console.log(`=> getAllMessages, limit: ${limit}, offset: ${offset}`);
    const messages = yield models_1.models.Message.findAll({ order: [['id', 'asc']], limit, offset });
    console.log('=> got msgs', (messages && messages.length));
    const chatIds = [];
    messages.forEach((m) => {
        if (m.chatId && !chatIds.includes(m.chatId)) {
            chatIds.push(m.chatId);
        }
    });
    let chats = chatIds.length > 0 ? yield models_1.models.Chat.findAll({ where: { deleted: false, id: chatIds } }) : [];
    console.log('=> found all chats', (chats && chats.length));
    const chatsById = underscore_1.indexBy(chats, 'id');
    console.log('=> indexed chats');
    res_1.success(res, {
        new_messages: messages.map(message => jsonUtils.messageToJson(message, chatsById[parseInt(message.chatId)])),
        confirmed_messages: []
    });
});
function deleteMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = parseInt(req.params.id);
        const message = yield models_1.models.Message.findOne({ where: { id } });
        const uuid = message.uuid;
        yield message.update({ status: constants_1.default.statuses.deleted });
        const chat_id = message.chatId;
        let chat;
        if (chat_id) {
            chat = yield models_1.models.Chat.findOne({ where: { id: chat_id } });
        }
        res_1.success(res, jsonUtils.messageToJson(message, chat));
        if (!chat)
            return;
        const isTribe = chat.type === constants_1.default.chat_types.tribe;
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
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
exports.sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // try {
    // 	schemas.message.validateSync(req.body)
    // } catch(e) {
    // 	return failure(res, e.message)
    // }
    const { contact_id, text, remote_text, chat_id, remote_text_map, amount, reply_uuid, boost, message_price, } = req.body;
    let msgtype = constants_1.default.message_types.message;
    if (boost)
        msgtype = constants_1.default.message_types.boost;
    var date = new Date();
    date.setMilliseconds(0);
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id,
    });
    let realSatsContactId;
    // IF BOOST NEED TO SEND ACTUAL SATS TO OG POSTER
    const isTribe = chat.type === constants_1.default.chat_types.tribe;
    const isTribeOwner = isTribe && owner.publicKey === chat.ownerPubkey;
    if (reply_uuid && boost && amount) {
        const ogMsg = yield models_1.models.Message.findOne({ where: {
                uuid: reply_uuid,
            } });
        if (ogMsg && ogMsg.sender) {
            realSatsContactId = ogMsg.sender;
        }
    }
    const hasRealAmount = amount && amount > constants_1.default.min_sat_amount;
    const remoteMessageContent = remote_text_map ? JSON.stringify(remote_text_map) : remote_text;
    const uuid = short.generate();
    let amtToStore = amount || 0;
    if (boost && message_price && typeof message_price === 'number' && amount && message_price < amount) {
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
        network_type: (!isTribe || hasRealAmount || realSatsContactId) ?
            constants_1.default.network_types.lightning :
            constants_1.default.network_types.mqtt
    };
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    // console.log(msg)
    const message = yield models_1.models.Message.create(msg);
    res_1.success(res, jsonUtils.messageToJson(message, chat));
    const msgToSend = {
        id: message.id,
        uuid: message.uuid,
        content: remote_text_map || remote_text || text,
        amount: amtToStore,
    };
    if (reply_uuid)
        msgToSend.replyUuid = reply_uuid;
    const sendMessageParams = {
        chat: chat,
        sender: owner,
        amount: amount || 0,
        type: msgtype,
        message: msgToSend,
    };
    if (realSatsContactId)
        sendMessageParams.realSatsContactId = realSatsContactId;
    // tribe owner deducts the "price per message + escrow amount" 
    if (realSatsContactId && isTribeOwner && amtToStore) {
        sendMessageParams.amount = amtToStore;
    }
    // final send
    network.sendMessage(sendMessageParams);
});
exports.receiveMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('received message', { payload })
    const { owner, sender, chat, content, remote_content, msg_id, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, amount, network_type } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const text = content || '';
    var date = new Date();
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
        status: constants_1.default.statuses.received,
        network_type: network_type,
    };
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        if (remote_content)
            msg.remoteMessageContent = remote_content;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    const message = yield models_1.models.Message.create(msg);
    socket.sendJson({
        type: 'message',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
    hub_1.sendNotification(chat, msg.senderAlias || sender.alias, 'message');
    const theChat = Object.assign(Object.assign({}, chat.dataValues), { contactIds: [sender.id] });
    confirmations_1.sendConfirmation({ chat: theChat, sender: owner, msg_id });
});
exports.receiveBoost = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, sender, chat, content, remote_content, chat_type, sender_alias, msg_uuid, date_string, reply_uuid, amount, network_type } = yield helpers.parseReceiveParams(payload);
    console.log('=> received boost ' + amount + ' sats on network:', network_type);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const text = content;
    var date = new Date();
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
        network_type
    };
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        if (remote_content)
            msg.remoteMessageContent = remote_content;
    }
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    const message = yield models_1.models.Message.create(msg);
    socket.sendJson({
        type: 'boost',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
});
exports.receiveRepayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, sender, chat, date_string, amount, network_type } = yield helpers.parseReceiveParams(payload);
    console.log('=> received repayment ' + amount + ' sats');
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    var date = new Date();
    date.setMilliseconds(0);
    if (date_string)
        date = new Date(date_string);
    const message = yield models_1.models.Message.create({
        // chatId: chat.id,
        type: constants_1.default.message_types.repayment,
        sender: sender.id,
        date: date,
        amount: amount || 0,
        createdAt: date,
        updatedAt: date,
        status: constants_1.default.statuses.received,
        network_type
    });
    socket.sendJson({
        type: 'repayment',
        response: jsonUtils.messageToJson(message, null, sender)
    });
});
exports.receiveDeleteMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> received delete message');
    const { owner, sender, chat, chat_type, msg_uuid } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return console.log('=> no group chat!');
    }
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    // in tribe this is already validated on admin's node
    let where = { uuid: msg_uuid };
    if (!isTribe) {
        where.sender = sender.id; // validate sender
    }
    const message = yield models_1.models.Message.findOne({ where });
    if (!message)
        return;
    yield message.update({ status: constants_1.default.statuses.deleted });
    socket.sendJson({
        type: 'delete',
        response: jsonUtils.messageToJson(message, chat, sender)
    });
});
exports.readMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chat_id = req.params.chat_id;
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    yield models_1.models.Message.update({ seen: true }, {
        where: {
            sender: {
                [sequelize_1.Op.ne]: owner.id
            },
            chatId: chat_id
        }
    });
    const chat = yield models_1.models.Chat.findOne({ where: { id: chat_id } });
    if (chat) {
        yield chat.update({ seen: true });
        res_1.success(res, {});
        hub_1.sendNotification(chat, '', 'badge');
        socket.sendJson({
            type: 'chat_seen',
            response: jsonUtils.chatToJson(chat)
        });
    }
    else {
        res_1.failure(res, 'no chat');
    }
});
exports.clearMessages = (req, res) => {
    models_1.models.Message.destroy({ where: {}, truncate: true });
    res_1.success(res, {});
};
//# sourceMappingURL=messages.js.map