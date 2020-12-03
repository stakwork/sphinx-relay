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
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const network = require("../network");
const rsa = require("../crypto/rsa");
const helpers = require("../helpers");
const socket = require("../utils/socket");
const tribes = require("../utils/tribes");
const hub_1 = require("../hub");
const msg_1 = require("../utils/msg");
const sequelize_1 = require("sequelize");
const constants_1 = require("../constants");
function joinTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> joinTribe');
        const { uuid, group_key, name, host, amount, img, owner_pubkey, owner_alias } = req.body;
        const is_private = req.body.private;
        const existing = yield models_1.models.Chat.findOne({ where: { uuid } });
        if (existing) {
            console.log('[tribes] u are already in this tribe');
            return res_1.failure(res, 'cant find tribe');
        }
        if (!owner_pubkey || !group_key || !uuid) {
            console.log('[tribes] missing required params');
            return res_1.failure(res, 'missing required params');
        }
        const ownerPubKey = owner_pubkey;
        // verify signature here?
        const tribeOwner = yield models_1.models.Contact.findOne({ where: { publicKey: ownerPubKey } });
        let theTribeOwner;
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const contactIds = [owner.id];
        if (tribeOwner) {
            theTribeOwner = tribeOwner; // might already include??
            if (!contactIds.includes(tribeOwner.id))
                contactIds.push(tribeOwner.id);
        }
        else {
            const createdContact = yield models_1.models.Contact.create({
                publicKey: ownerPubKey,
                contactKey: '',
                alias: owner_alias || 'Unknown',
                status: 1,
                fromGroup: true,
            });
            theTribeOwner = createdContact;
            contactIds.push(createdContact.id);
        }
        let date = new Date();
        date.setMilliseconds(0);
        const chatStatus = is_private ?
            constants_1.default.chat_statuses.pending :
            constants_1.default.chat_statuses.approved;
        const chatParams = {
            uuid: uuid,
            contactIds: JSON.stringify(contactIds),
            photoUrl: img || '',
            createdAt: date,
            updatedAt: date,
            name: name,
            type: constants_1.default.chat_types.tribe,
            host: host || tribes.getHost(),
            groupKey: group_key,
            ownerPubkey: owner_pubkey,
            private: is_private || false,
            status: chatStatus,
            priceToJoin: amount || 0,
        };
        const typeToSend = is_private ?
            constants_1.default.message_types.member_request :
            constants_1.default.message_types.group_join;
        const contactIdsToSend = is_private ?
            [theTribeOwner.id] : // ONLY SEND TO TRIBE OWNER IF ITS A REQUEST
            chatParams.contactIds;
        console.log('=> joinTribe: typeToSend', typeToSend);
        console.log('=> joinTribe: contactIdsToSend', contactIdsToSend);
        network.sendMessage({
            chat: Object.assign(Object.assign({}, chatParams), { contactIds: contactIdsToSend, members: {
                    [owner.publicKey]: {
                        key: owner.contactKey,
                        alias: owner.alias || ''
                    }
                } }),
            amount: amount || 0,
            sender: owner,
            message: {},
            type: typeToSend,
            failure: function (e) {
                res_1.failure(res, e);
            },
            success: function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const chat = yield models_1.models.Chat.create(chatParams);
                    models_1.models.ChatMember.create({
                        contactId: theTribeOwner.id,
                        chatId: chat.id,
                        role: constants_1.default.chat_roles.owner,
                        lastActive: date,
                        status: constants_1.default.chat_statuses.approved
                    });
                    res_1.success(res, jsonUtils.chatToJson(chat));
                });
            }
        });
    });
}
exports.joinTribe = joinTribe;
function receiveMemberRequest(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveMemberRequest');
        const { sender_pub_key, sender_alias, chat_uuid, chat_members, chat_type, isTribeOwner, network_type, sender_photo_url } = yield helpers.parseReceiveParams(payload);
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        if (!chat)
            return console.log('no chat');
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        if (!isTribe || !isTribeOwner)
            return console.log('not a tribe');
        var date = new Date();
        date.setMilliseconds(0);
        let theSender = null;
        const member = chat_members[sender_pub_key];
        const senderAlias = sender_alias || (member && member.alias) || 'Unknown';
        const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key } });
        if (sender) {
            theSender = sender; // might already include??
        }
        else {
            if (member && member.key) {
                const createdContact = yield models_1.models.Contact.create({
                    publicKey: sender_pub_key,
                    contactKey: member.key,
                    alias: senderAlias,
                    status: 1,
                    fromGroup: true,
                    photoUrl: sender_photo_url
                });
                theSender = createdContact;
            }
        }
        if (!theSender)
            return console.log('no sender'); // fail (no contact key?)
        console.log("UPSERT", {
            contactId: theSender.id,
            chatId: chat.id,
            role: constants_1.default.chat_roles.reader,
            status: constants_1.default.chat_statuses.pending,
            lastActive: date,
        });
        // maybe check here manually????
        try {
            yield models_1.models.ChatMember.upsert({
                contactId: theSender.id,
                chatId: chat.id,
                role: constants_1.default.chat_roles.reader,
                status: constants_1.default.chat_statuses.pending,
                lastActive: date,
            });
        }
        catch (e) { }
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_request,
            sender: (theSender && theSender.id) || 0,
            messageContent: '', remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date, createdAt: date, updatedAt: date,
            network_type
        };
        if (isTribe) {
            msg.senderAlias = sender_alias;
            msg.senderPic = sender_photo_url;
        }
        const message = yield models_1.models.Message.create(msg);
        const theChat = yield addPendingContactIdsToChat(chat);
        socket.sendJson({
            type: 'member_request',
            response: {
                contact: jsonUtils.contactToJson(theSender || {}),
                chat: jsonUtils.chatToJson(theChat),
                message: jsonUtils.messageToJson(message, theChat)
            }
        });
    });
}
exports.receiveMemberRequest = receiveMemberRequest;
function editTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, price_per_message, price_to_join, escrow_amount, escrow_millis, img, description, tags, unlisted, app_url, feed_url, } = req.body;
        const { id } = req.params;
        if (!id)
            return res_1.failure(res, 'group id is required');
        const chat = yield models_1.models.Chat.findOne({ where: { id } });
        if (!chat) {
            return res_1.failure(res, 'cant find chat');
        }
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        let okToUpdate = true;
        if (owner.publicKey === chat.ownerPubkey) {
            try {
                yield tribes.edit({
                    uuid: chat.uuid,
                    name: name,
                    host: chat.host,
                    price_per_message: price_per_message || 0,
                    price_to_join: price_to_join || 0,
                    escrow_amount: escrow_amount || 0,
                    escrow_millis: escrow_millis || 0,
                    description,
                    tags,
                    img,
                    owner_alias: owner.alias,
                    unlisted,
                    is_private: req.body.private,
                    app_url,
                    feed_url,
                    deleted: false,
                });
            }
            catch (e) {
                okToUpdate = false;
            }
        }
        if (okToUpdate) {
            const obj = {};
            if (img)
                obj.photoUrl = img;
            if (name)
                obj.name = name;
            if (price_per_message || price_per_message === 0)
                obj.pricePerMessage = price_per_message;
            if (price_to_join || price_to_join === 0)
                obj.priceToJoin = price_to_join;
            if (escrow_amount || escrow_amount === 0)
                obj.escrowAmount = escrow_amount;
            if (escrow_millis || escrow_millis === 0)
                obj.escrowMillis = escrow_millis;
            if (unlisted || unlisted === false)
                obj.unlisted = unlisted;
            if (app_url)
                obj.appUrl = app_url;
            if (feed_url)
                obj.feedUrl = feed_url;
            if (req.body.private || req.body.private === false)
                obj.private = req.body.private;
            if (Object.keys(obj).length > 0) {
                yield chat.update(obj);
            }
            res_1.success(res, jsonUtils.chatToJson(chat));
        }
        else {
            res_1.failure(res, 'failed to update tribe');
        }
    });
}
exports.editTribe = editTribe;
function approveOrRejectMember(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> approve or reject tribe member');
        const msgId = parseInt(req.params['messageId']);
        const contactId = parseInt(req.params['contactId']);
        const status = req.params['status'];
        const msg = yield models_1.models.Message.findOne({ where: { id: msgId } });
        if (!msg)
            return res_1.failure(res, 'no message');
        const chatId = msg.chatId;
        const chat = yield models_1.models.Chat.findOne({ where: { id: chatId } });
        if (!chat)
            return res_1.failure(res, 'no chat');
        if (!msgId || !contactId || !(status === 'approved' || status === 'rejected')) {
            return res_1.failure(res, 'incorrect status');
        }
        let memberStatus = constants_1.default.chat_statuses.rejected;
        let msgType = constants_1.default.message_types.member_reject;
        if (status === 'approved') {
            memberStatus = constants_1.default.chat_statuses.approved;
            msgType = constants_1.default.message_types.member_approve;
            const contactIds = JSON.parse(chat.contactIds || '[]');
            if (!contactIds.includes(contactId))
                contactIds.push(contactId);
            yield chat.update({ contactIds: JSON.stringify(contactIds) });
        }
        yield msg.update({ type: msgType });
        const member = yield models_1.models.ChatMember.findOne({ where: { contactId, chatId } });
        if (!member) {
            return res_1.failure(res, 'cant find chat member');
        }
        // update ChatMember status
        yield member.update({ status: memberStatus });
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const chatToSend = chat.dataValues || chat;
        network.sendMessage({
            chat: Object.assign(Object.assign({}, chatToSend), { contactIds: [member.contactId] }),
            amount: 0,
            sender: owner,
            message: {},
            type: msgType,
        });
        const theChat = yield addPendingContactIdsToChat(chat);
        res_1.success(res, {
            chat: jsonUtils.chatToJson(theChat),
            message: jsonUtils.messageToJson(msg, theChat)
        });
    });
}
exports.approveOrRejectMember = approveOrRejectMember;
function receiveMemberApprove(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveMemberApprove');
        const { owner, chat, chat_name, sender, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return console.log('no chat');
        yield chat.update({ status: constants_1.default.chat_statuses.approved });
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_approve,
            sender: (sender && sender.id) || 0,
            messageContent: '', remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date, createdAt: date, updatedAt: date,
            network_type
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'member_approve',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            }
        });
        const amount = chat.priceToJoin || 0;
        const theChat = chat.dataValues || chat;
        // send JOIN and my info to all 
        network.sendMessage({
            chat: Object.assign(Object.assign({}, theChat), { members: {
                    [owner.publicKey]: {
                        key: owner.contactKey,
                        alias: owner.alias || ''
                    }
                } }),
            amount,
            sender: owner,
            message: {},
            type: constants_1.default.message_types.group_join,
        });
        hub_1.sendNotification(chat, chat_name, 'group');
    });
}
exports.receiveMemberApprove = receiveMemberApprove;
function receiveMemberReject(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveMemberReject');
        const { chat, sender, chat_name, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return console.log('no chat');
        yield chat.update({ status: constants_1.default.chat_statuses.rejected });
        // dang.. nothing really to do here?
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_reject,
            sender: (sender && sender.id) || 0,
            messageContent: '', remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date, createdAt: date, updatedAt: date,
            network_type
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'member_reject',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            }
        });
        hub_1.sendNotification(chat, chat_name, 'reject');
    });
}
exports.receiveMemberReject = receiveMemberReject;
function receiveTribeDelete(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveTribeDelete');
        const { chat, sender, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return console.log('no chat');
        // await chat.update({status: constants.chat_statuses.rejected})
        // update on tribes server too
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.tribe_delete,
            sender: (sender && sender.id) || 0,
            messageContent: '', remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date, createdAt: date, updatedAt: date,
            network_type
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'tribe_delete',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            }
        });
    });
}
exports.receiveTribeDelete = receiveTribeDelete;
function replayChatHistory(chat, contact) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('-> replayHistory');
        if (!(chat && chat.id && contact && contact.id)) {
            return console.log('[tribes] cant replay history');
        }
        try {
            const msgs = yield models_1.models.Message.findAll({
                where: { chatId: chat.id, type: { [sequelize_1.Op.in]: network.typesToReplay } },
                order: [['id', 'desc']],
                limit: 40
            });
            msgs.reverse();
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            asyncForEach(msgs, (m) => __awaiter(this, void 0, void 0, function* () {
                if (!network.typesToReplay.includes(m.type))
                    return; // only for message for now
                const sender = Object.assign(Object.assign(Object.assign(Object.assign({}, owner.dataValues), m.senderAlias && { alias: m.senderAlias }), { role: constants_1.default.chat_roles.reader }), m.senderPic && { photoUrl: m.senderPic });
                let content = '';
                try {
                    content = JSON.parse(m.remoteMessageContent);
                }
                catch (e) { }
                let mdate = m.date;
                if (!mdate)
                    mdate = new Date();
                const dateString = mdate.toISOString();
                let mediaKeyMap;
                let newMediaTerms;
                if (m.type === constants_1.default.message_types.attachment) {
                    if (m.mediaKey && m.mediaToken) {
                        const muid = m.mediaToken.split('.').length && m.mediaToken.split('.')[1];
                        if (muid) {
                            const mediaKey = yield models_1.models.MediaKey.findOne({ where: {
                                    muid, chatId: chat.id,
                                } });
                            // console.log("FOUND MEDIA KEY!!",mediaKey.dataValues)
                            mediaKeyMap = { chat: mediaKey.key };
                            newMediaTerms = { muid: mediaKey.muid };
                        }
                    }
                }
                const isForwarded = true;
                let msg = network.newmsg(m.type, chat, sender, Object.assign(Object.assign(Object.assign(Object.assign({ content }, mediaKeyMap && { mediaKey: mediaKeyMap }), newMediaTerms && { mediaToken: newMediaTerms }), m.mediaType && { mediaType: m.mediaType }), dateString && { date: dateString }), isForwarded);
                msg = yield msg_1.decryptMessage(msg, chat);
                const data = yield msg_1.personalizeMessage(msg, contact, true);
                const mqttTopic = `${contact.publicKey}/${chat.uuid}`;
                const replayingHistory = true;
                // console.log("-> HISTORY DATA:",data)
                yield network.signAndSend({
                    data,
                    dest: contact.publicKey,
                }, mqttTopic, replayingHistory);
            }));
        }
        catch (e) {
            console.log('replayChatHistory ERROR', e);
        }
    });
}
exports.replayChatHistory = replayChatHistory;
function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url) {
    return __awaiter(this, void 0, void 0, function* () {
        let date = new Date();
        date.setMilliseconds(0);
        if (!(owner && contactIds && Array.isArray(contactIds))) {
            return {};
        }
        // make ts sig here w LNd pubkey - that is UUID
        const keys = yield rsa.genKeys();
        const groupUUID = yield tribes.genSignedTimestamp();
        const theContactIds = contactIds.includes(owner.id) ? contactIds : [owner.id].concat(contactIds);
        return {
            uuid: groupUUID,
            ownerPubkey: owner.publicKey,
            contactIds: JSON.stringify(theContactIds),
            createdAt: date,
            updatedAt: date,
            photoUrl: img || '',
            name: name,
            type: constants_1.default.chat_types.tribe,
            groupKey: keys.public,
            groupPrivateKey: keys.private,
            host: tribes.getHost(),
            pricePerMessage: price_per_message || 0,
            priceToJoin: price_to_join || 0,
            escrowMillis: escrow_millis || 0,
            escrowAmount: escrow_amount || 0,
            unlisted: unlisted || false,
            private: is_private || false,
            appUrl: app_url || '',
            feedUrl: feed_url || '',
        };
    });
}
exports.createTribeChatParams = createTribeChatParams;
function addPendingContactIdsToChat(achat) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield models_1.models.ChatMember.findAll({ where: {
                chatId: achat.id,
                status: constants_1.default.chat_statuses.pending // only pending
            } });
        if (!members)
            return achat;
        const pendingContactIds = members.map(m => m.contactId);
        const chat = achat.dataValues || achat;
        return Object.assign(Object.assign({}, chat), { pendingContactIds });
    });
}
exports.addPendingContactIdsToChat = addPendingContactIdsToChat;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=chatTribes.js.map