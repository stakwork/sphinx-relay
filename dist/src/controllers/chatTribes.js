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
exports.addPendingContactIdsToChat = exports.createTribeChatParams = exports.replayChatHistory = exports.receiveTribeDelete = exports.receiveMemberReject = exports.receiveMemberApprove = exports.approveOrRejectMember = exports.editTribe = exports.pinToTribe = exports.receiveMemberRequest = exports.deleteChannel = exports.createChannel = exports.joinTribe = void 0;
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
const logger_1 = require("../utils/logger");
function joinTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info('=> joinTribe', logger_1.logging.Express);
        const { uuid, group_key, name, host, amount, img, owner_pubkey, owner_route_hint, owner_alias, my_alias, my_photo_url, } = req.body;
        logger_1.sphinxLogger.info(['received owner route hint', owner_route_hint], logger_1.logging.Express);
        const is_private = req.body.private ? true : false;
        const existing = yield models_1.models.Chat.findOne({ where: { uuid, tenant } });
        if (existing) {
            logger_1.sphinxLogger.error('You are already in this tribe', logger_1.logging.Tribes);
            return (0, res_1.failure)(res, 'cant find tribe');
        }
        if (!owner_pubkey || !group_key || !uuid) {
            logger_1.sphinxLogger.error('missing required params', logger_1.logging.Tribes);
            return (0, res_1.failure)(res, 'missing required params');
        }
        const ownerPubKey = owner_pubkey;
        // verify signature here?
        const tribeOwner = yield models_1.models.Contact.findOne({
            where: { publicKey: ownerPubKey, tenant },
        });
        let theTribeOwner;
        const owner = req.owner;
        const contactIds = [owner.id];
        if (tribeOwner) {
            theTribeOwner = tribeOwner; // might already include??
            if (tribeOwner.routeHint !== owner_route_hint) {
                yield tribeOwner.update({ routeHint: owner_route_hint });
            }
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
                tenant,
                routeHint: owner_route_hint || '',
            });
            theTribeOwner = createdContact;
            // console.log("CREATE TRIBE OWNER", createdContact);
            contactIds.push(createdContact.id);
        }
        let date = new Date();
        date.setMilliseconds(0);
        const chatStatus = is_private
            ? constants_1.default.chat_statuses.pending
            : constants_1.default.chat_statuses.approved;
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
            tenant,
        };
        if (my_alias)
            chatParams.myAlias = my_alias;
        if (my_photo_url)
            chatParams.myPhotoUrl = my_photo_url;
        const typeToSend = is_private
            ? constants_1.default.message_types.member_request
            : constants_1.default.message_types.group_join;
        const contactIdsToSend = is_private
            ? JSON.stringify([theTribeOwner.id]) // ONLY SEND TO TRIBE OWNER IF ITS A REQUEST
            : JSON.stringify(contactIds);
        // console.log("=> joinTribe: typeToSend", typeToSend);
        // console.log("=> joinTribe: contactIdsToSend", contactIdsToSend);
        // set my alias to be the custom one
        const theOwner = owner.dataValues || owner;
        if (my_alias)
            theOwner.alias = my_alias;
        network.sendMessage({
            // send my data to tribe owner
            chat: Object.assign(Object.assign({}, chatParams), { contactIds: contactIdsToSend, members: {
                    [owner.publicKey]: {
                        key: owner.contactKey,
                        alias: my_alias || owner.alias || '',
                    },
                } }),
            amount: amount || 0,
            sender: theOwner,
            message: {},
            type: typeToSend,
            failure: function (e) {
                (0, res_1.failure)(res, e);
            },
            success: function () {
                return __awaiter(this, void 0, void 0, function* () {
                    // console.log("=> joinTribe: CREATE CHAT RECORD NOW");
                    const chat = yield models_1.models.Chat.create(chatParams);
                    models_1.models.ChatMember.create({
                        contactId: theTribeOwner.id,
                        chatId: chat.id,
                        role: constants_1.default.chat_roles.owner,
                        lastActive: date,
                        status: constants_1.default.chat_statuses.approved,
                        tenant,
                    });
                    // console.log("=> joinTribe: CREATED CHAT", chat.dataValues);
                    tribes.addExtraHost(theOwner.publicKey, host, network.receiveMqttMessage);
                    (0, res_1.success)(res, jsonUtils.chatToJson(chat));
                });
            },
        });
    });
}
exports.joinTribe = joinTribe;
function createChannel(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const owner = req.owner;
        //const tenant: number = req.owner.id
        const { tribe_uuid, name, host } = req.body;
        const channel = yield tribes.createChannel({
            tribe_uuid,
            name,
            host,
            owner_pubkey: owner.publicKey,
        });
        (0, res_1.success)(res, channel);
    });
}
exports.createChannel = createChannel;
function deleteChannel(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const owner = req.owner;
        const { id, host } = req.body;
        const channel = yield tribes.deleteChannel({
            id,
            host,
            owner_pubkey: owner.publicKey,
        });
        (0, res_1.success)(res, channel);
    });
}
exports.deleteChannel = deleteChannel;
function receiveMemberRequest(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> receiveMemberRequest', logger_1.logging.Network);
        const { owner, chat, sender_pub_key, sender_alias, chat_members, chat_type, isTribeOwner, network_type, sender_photo_url, sender_route_hint, } = yield helpers.parseReceiveParams(payload);
        const tenant = owner.id;
        if (!chat)
            return logger_1.sphinxLogger.error('no chat');
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        if (!isTribe || !isTribeOwner)
            return logger_1.sphinxLogger.error('not a tribe');
        var date = new Date();
        date.setMilliseconds(0);
        let theSender = null;
        const member = chat_members[sender_pub_key];
        const senderAlias = (member && member.alias) || sender_alias || 'Unknown';
        const sender = yield models_1.models.Contact.findOne({
            where: { publicKey: sender_pub_key, tenant },
        });
        if (sender) {
            theSender = sender; // might already include??
        }
        else {
            if (member && member.key) {
                const createdContact = yield models_1.models.Contact.create({
                    publicKey: sender_pub_key,
                    contactKey: member.key,
                    alias: sender_alias || senderAlias,
                    status: 1,
                    fromGroup: true,
                    photoUrl: sender_photo_url,
                    tenant,
                    routeHint: sender_route_hint || '',
                });
                theSender = createdContact;
            }
        }
        if (!theSender)
            return logger_1.sphinxLogger.error('no sender'); // fail (no contact key?)
        logger_1.sphinxLogger.info([
            'UPSERT',
            {
                contactId: theSender.id,
                chatId: chat.id,
                role: constants_1.default.chat_roles.reader,
                status: constants_1.default.chat_statuses.pending,
                lastActive: date,
                lastAlias: senderAlias,
            },
        ]);
        // maybe check here manually????
        try {
            yield models_1.models.ChatMember.upsert({
                contactId: theSender.id,
                chatId: chat.id,
                role: constants_1.default.chat_roles.reader,
                status: constants_1.default.chat_statuses.pending,
                lastActive: date,
                lastAlias: senderAlias,
                tenant,
            });
            // also update the chat
            const theChat = yield models_1.models.Chat.findOne({ where: { id: chat.id } });
            if (theChat) {
                yield theChat.update({ updatedAt: date });
            }
        }
        catch (e) { }
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_request,
            sender: (theSender && theSender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        if (isTribe) {
            msg.senderAlias = senderAlias;
            msg.senderPic = sender_photo_url;
        }
        const message = yield models_1.models.Message.create(msg);
        const theChat = yield addPendingContactIdsToChat(chat, tenant);
        socket.sendJson({
            type: 'member_request',
            response: {
                contact: jsonUtils.contactToJson(theSender || {}),
                chat: jsonUtils.chatToJson(theChat),
                message: jsonUtils.messageToJson(message, theChat),
            },
        }, tenant);
    });
}
exports.receiveMemberRequest = receiveMemberRequest;
function pinToTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { pin } = req.body;
        const { id } = req.params;
        if (!id)
            return (0, res_1.failure)(res, 'group id is required');
        const chat = yield models_1.models.Chat.findOne({ where: { id, tenant } });
        if (!chat) {
            return (0, res_1.failure)(res, 'cant find chat');
        }
        const owner = req.owner;
        if (owner.publicKey !== chat.ownerPubkey) {
            return (0, res_1.failure)(res, 'not your tribe');
        }
        try {
            let td = yield tribes.get_tribe_data(chat.uuid);
            let chatData = chat.dataValues || chat;
            chatData.pin = pin;
            yield tribes.edit(mergeTribeAndChatData(chatData, td, owner));
            yield models_1.models.Chat.update({ pin }, { where: { id, tenant } });
            (0, res_1.success)(res, { pin });
        }
        catch (e) {
            return (0, res_1.failure)(res, 'failed to update pin');
        }
    });
}
exports.pinToTribe = pinToTribe;
function editTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { name, price_per_message, price_to_join, escrow_amount, escrow_millis, img, description, tags, unlisted, app_url, feed_url, feed_type, pin, } = req.body;
        const { id } = req.params;
        if (!id)
            return (0, res_1.failure)(res, 'group id is required');
        const chat = yield models_1.models.Chat.findOne({ where: { id, tenant } });
        if (!chat) {
            return (0, res_1.failure)(res, 'cant find chat');
        }
        const owner = req.owner;
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
                    feed_type,
                    deleted: false,
                    owner_route_hint: owner.routeHint || '',
                    owner_pubkey: owner.publicKey,
                    pin: pin || '',
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
            if (feed_type)
                obj.feedType = feed_type;
            if (req.body.private || req.body.private === false)
                obj.private = req.body.private;
            if (Object.keys(obj).length > 0) {
                yield chat.update(obj);
            }
            (0, res_1.success)(res, jsonUtils.chatToJson(chat));
        }
        else {
            (0, res_1.failure)(res, 'failed to update tribe');
        }
    });
}
exports.editTribe = editTribe;
function approveOrRejectMember(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info('=> approve or reject tribe member');
        const msgId = parseInt(req.params['messageId']);
        const contactId = parseInt(req.params['contactId']);
        const status = req.params['status'];
        const msg = yield models_1.models.Message.findOne({ where: { id: msgId, tenant } });
        if (!msg)
            return (0, res_1.failure)(res, 'no message');
        const chatId = msg.chatId;
        const chat = yield models_1.models.Chat.findOne({ where: { id: chatId, tenant } });
        if (!chat)
            return (0, res_1.failure)(res, 'no chat');
        if (!msgId ||
            !contactId ||
            !(status === 'approved' || status === 'rejected')) {
            return (0, res_1.failure)(res, 'incorrect status');
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
        const member = yield models_1.models.ChatMember.findOne({
            where: { contactId, chatId },
        });
        if (!member) {
            return (0, res_1.failure)(res, 'cant find chat member');
        }
        if (status === 'approved') {
            // update ChatMember status
            yield member.update({ status: memberStatus });
        }
        else if (status === 'rejected') {
            // destroy the row
            yield member.destroy();
        }
        const owner = req.owner;
        const chatToSend = chat.dataValues || chat;
        network.sendMessage({
            // send to the requester
            chat: Object.assign(Object.assign({}, chatToSend), { contactIds: [member.contactId] }),
            amount: 0,
            sender: owner,
            message: {},
            type: msgType,
        });
        const theChat = yield addPendingContactIdsToChat(chat, tenant);
        (0, res_1.success)(res, {
            chat: jsonUtils.chatToJson(theChat),
            message: jsonUtils.messageToJson(msg, theChat),
        });
    });
}
exports.approveOrRejectMember = approveOrRejectMember;
function receiveMemberApprove(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('-> receiveMemberApprove', logger_1.logging.Network);
        const { owner, chat, sender, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return logger_1.sphinxLogger.error('no chat');
        yield chat.update({ status: constants_1.default.chat_statuses.approved });
        const tenant = owner.id;
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_approve,
            sender: (sender && sender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'member_approve',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            },
        }, tenant);
        const amount = chat.priceToJoin || 0;
        const theChat = chat.dataValues || chat;
        const theOwner = owner;
        const theAlias = chat.myAlias || owner.alias;
        if (theAlias)
            theOwner.alias = theAlias;
        // send JOIN and my info to all
        network.sendMessage({
            chat: Object.assign(Object.assign({}, theChat), { members: {
                    [owner.publicKey]: {
                        key: owner.contactKey,
                        alias: theAlias || '',
                    },
                } }),
            amount,
            sender: theOwner,
            message: {},
            type: constants_1.default.message_types.group_join,
        });
        // sendNotification(chat, chat_name, "group", theOwner);
    });
}
exports.receiveMemberApprove = receiveMemberApprove;
function receiveMemberReject(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('-> receiveMemberReject', logger_1.logging.Network);
        const { owner, chat, sender, chat_name, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return logger_1.sphinxLogger.error('no chat');
        yield chat.update({ status: constants_1.default.chat_statuses.rejected });
        const tenant = owner.id;
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.member_reject,
            sender: (sender && sender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'member_reject',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            },
        }, tenant);
        (0, hub_1.sendNotification)(chat, chat_name, 'reject', owner);
    });
}
exports.receiveMemberReject = receiveMemberReject;
function receiveTribeDelete(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('-> receiveTribeDelete', logger_1.logging.Network);
        const { owner, chat, sender, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return logger_1.sphinxLogger.error('no chat');
        const tenant = owner.id;
        // await chat.update({status: constants.chat_statuses.rejected})
        // update on tribes server too
        let date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.tribe_delete,
            sender: (sender && sender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'tribe_delete',
            response: {
                message: jsonUtils.messageToJson(message, chat),
                chat: jsonUtils.chatToJson(chat),
            },
        }, tenant);
    });
}
exports.receiveTribeDelete = receiveTribeDelete;
function replayChatHistory(chat, contact, ownerRecord) {
    return __awaiter(this, void 0, void 0, function* () {
        const owner = ownerRecord.dataValues || ownerRecord;
        const tenant = owner.id;
        logger_1.sphinxLogger.info('-> replayHistory', logger_1.logging.Tribes);
        if (!(chat && chat.id && contact && contact.id)) {
            return logger_1.sphinxLogger.info('cant replay history', logger_1.logging.Tribes);
        }
        try {
            const msgs = yield models_1.models.Message.findAll({
                where: {
                    tenant,
                    chatId: chat.id,
                    type: { [sequelize_1.Op.in]: network.typesToReplay },
                },
                order: [['id', 'desc']],
                limit: 40,
            });
            msgs.reverse();
            // if theres a pinned msg in this chat
            if (chat.pin) {
                const pinned = msgs.find((m) => m.uuid === chat.pin);
                // if the pinned msg is not already included
                if (!pinned) {
                    const pinnedMsg = yield models_1.models.Message.findOne({
                        where: {
                            tenant,
                            chatId: chat.id,
                            type: { [sequelize_1.Op.in]: network.typesToReplay },
                            uuid: chat.pin,
                        },
                    });
                    // add it
                    if (pinnedMsg) {
                        msgs.push(pinnedMsg);
                    }
                }
            }
            asyncForEach(msgs, (m) => __awaiter(this, void 0, void 0, function* () {
                if (!network.typesToReplay.includes(m.type))
                    return; // only for message for now
                if (chat.skipBroadcastJoins) {
                    if (network.typesToSkipIfSkipBroadcastJoins.includes(m.type)) {
                        return; // no join or leave announcements if set this way
                    }
                }
                const sender = Object.assign(Object.assign(Object.assign(Object.assign({}, owner), (m.senderAlias && { alias: m.senderAlias })), { role: constants_1.default.chat_roles.reader }), (m.senderPic && { photoUrl: m.senderPic }));
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
                            const mediaKey = yield models_1.models.MediaKey.findOne({
                                where: {
                                    muid,
                                    chatId: chat.id,
                                    tenant,
                                },
                            });
                            // console.log("FOUND MEDIA KEY!!",mediaKey.dataValues)
                            mediaKeyMap = { chat: mediaKey.key };
                            newMediaTerms = { muid: mediaKey.muid };
                        }
                    }
                }
                const isForwarded = m.sender !== tenant;
                const includeStatus = true;
                let msg = network.newmsg(m.type, chat, sender, Object.assign(Object.assign(Object.assign(Object.assign({ content, uuid: m.uuid, replyUuid: m.replyUuid, parentId: m.parentId || 0, status: m.status, amount: m.amount }, (mediaKeyMap && { mediaKey: mediaKeyMap })), (newMediaTerms && { mediaToken: newMediaTerms })), (m.mediaType && { mediaType: m.mediaType })), (dateString && { date: dateString })), isForwarded, includeStatus);
                msg = yield (0, msg_1.decryptMessage)(msg, chat);
                const data = yield (0, msg_1.personalizeMessage)(msg, contact, true);
                const mqttTopic = `${contact.publicKey}/${chat.uuid}`;
                const replayingHistory = true;
                // console.log("-> HISTORY DATA:",data)
                yield network.signAndSend({
                    data,
                    dest: contact.publicKey,
                    route_hint: contact.routeHint,
                }, owner, mqttTopic, replayingHistory);
            })); // end forEach
        }
        catch (e) {
            logger_1.sphinxLogger.error(['replayChatHistory ERROR', e]);
        }
    });
}
exports.replayChatHistory = replayChatHistory;
function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, feed_type, tenant, pin) {
    return __awaiter(this, void 0, void 0, function* () {
        let date = new Date();
        date.setMilliseconds(0);
        if (!(owner && contactIds && Array.isArray(contactIds))) {
            return {};
        }
        // make ts sig here w LNd pubkey - that is UUID
        const keys = yield rsa.genKeys();
        const groupUUID = yield tribes.genSignedTimestamp(owner.publicKey);
        const theContactIds = contactIds.includes(owner.id)
            ? contactIds
            : [owner.id].concat(contactIds);
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
            feedType: feed_type || 0,
            tenant,
            pin: pin || '',
        };
    });
}
exports.createTribeChatParams = createTribeChatParams;
function addPendingContactIdsToChat(achat, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield models_1.models.ChatMember.findAll({
            where: {
                chatId: achat.id,
                status: constants_1.default.chat_statuses.pending,
                tenant,
            },
        });
        if (!members)
            return achat;
        const pendingContactIds = members.map((m) => m.contactId);
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
function mergeTribeAndChatData(chat, td, owner) {
    return {
        uuid: chat.uuid,
        name: chat.name,
        host: chat.host,
        price_per_message: chat.pricePerMessage,
        price_to_join: chat.priceToJoin,
        escrow_amount: chat.escrowAmount,
        escrow_millis: chat.escrowMillis,
        app_url: chat.appUrl,
        feed_url: chat.feedUrl,
        feed_type: chat.feedType,
        pin: chat.pin || '',
        deleted: false,
        owner_alias: owner.alias,
        owner_route_hint: owner.routeHint || '',
        owner_pubkey: owner.publicKey,
        description: td.description,
        tags: td.tags,
        img: td.img,
        unlisted: td.unlisted,
        is_private: td.private,
    };
}
//# sourceMappingURL=chatTribes.js.map