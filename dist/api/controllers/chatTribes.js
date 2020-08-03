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
const path = require("path");
const msg_1 = require("../utils/msg");
const sequelize_1 = require("sequelize");
const constants = require(path.join(__dirname, '../../config/constants.json'));
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
            constants.chat_statuses.pending :
            constants.chat_statuses.approved;
        const chatParams = {
            uuid: uuid,
            contactIds: JSON.stringify(contactIds),
            photoUrl: img || '',
            createdAt: date,
            updatedAt: date,
            name: name,
            type: constants.chat_types.tribe,
            host: host || tribes.getHost(),
            groupKey: group_key,
            ownerPubkey: owner_pubkey,
            private: is_private || false,
            status: chatStatus
        };
        const typeToSend = is_private ?
            constants.message_types.member_request :
            constants.message_types.group_join;
        const contactIdsToSend = is_private ?
            [theTribeOwner.id] : // ONLY SEND TO TRIBE OWNER IF ITS A REQUEST
            chatParams.contactIds;
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
                        role: constants.chat_roles.owner,
                        lastActive: date,
                        status: constants.chat_statuses.approved
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
        const { sender_pub_key, sender_alias, chat_uuid, chat_members, chat_type, isTribeOwner } = yield helpers.parseReceiveParams(payload);
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        if (!chat)
            return;
        const isTribe = chat_type === constants.chat_types.tribe;
        if (!isTribe || !isTribeOwner)
            return;
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
                });
                theSender = createdContact;
            }
        }
        if (!theSender)
            return console.log('no sender'); // fail (no contact key?)
        models_1.models.ChatMember.create({
            contactId: theSender.id,
            chatId: chat.id,
            role: constants.chat_roles.reader,
            status: constants.chat_statuses.pending,
            lastActive: date,
        });
        const msg = {
            chatId: chat.id,
            type: constants.message_types.member_request,
            sender: (theSender && theSender.id) || 0,
            messageContent: '', remoteMessageContent: '',
            status: constants.statuses.confirmed,
            date: date, createdAt: date, updatedAt: date
        };
        if (isTribe) {
            msg.senderAlias = sender_alias;
        }
        const message = yield models_1.models.Message.create(msg);
        const theChat = addPendingContactIdsToChat(chat);
        socket.sendJson({
            type: 'member_request',
            response: {
                contact: jsonUtils.contactToJson(theSender || {}),
                chat: jsonUtils.chatToJson(theChat),
                message: jsonUtils.messageToJson(message, null)
            }
        });
    });
}
exports.receiveMemberRequest = receiveMemberRequest;
function receiveMemberApprove(payload) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.receiveMemberApprove = receiveMemberApprove;
function receiveMemberReject(payload) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.receiveMemberReject = receiveMemberReject;
function replayChatHistory(chat, contact) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(chat && chat.id && contact && contact.id)) {
            return console.log('[tribes] cant replay history');
        }
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
            const sender = Object.assign(Object.assign({}, owner.dataValues), m.senderAlias && { alias: m.senderAlias });
            let content = '';
            try {
                content = JSON.parse(m.remoteMessageContent);
            }
            catch (e) { }
            const dateString = m.date && m.date.toISOString();
            let mediaKeyMap;
            let newMediaTerms;
            if (m.type === constants.message_types.attachment) {
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
            let msg = network.newmsg(m.type, chat, sender, Object.assign(Object.assign(Object.assign(Object.assign({ content }, mediaKeyMap && { mediaKey: mediaKeyMap }), newMediaTerms && { mediaToken: newMediaTerms }), m.mediaType && { mediaType: m.mediaType }), dateString && { date: dateString }));
            msg = yield msg_1.decryptMessage(msg, chat);
            const data = yield msg_1.personalizeMessage(msg, contact, true);
            const mqttTopic = `${contact.publicKey}/${chat.uuid}`;
            const replayingHistory = true;
            yield network.signAndSend({
                data,
                dest: contact.publicKey,
            }, mqttTopic, replayingHistory);
        }));
    });
}
exports.replayChatHistory = replayChatHistory;
function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join, escrow_amount, escrow_millis, unlisted, is_private) {
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
            type: constants.chat_types.tribe,
            groupKey: keys.public,
            groupPrivateKey: keys.private,
            host: tribes.getHost(),
            pricePerMessage: price_per_message || 0,
            priceToJoin: price_to_join || 0,
            escrowMillis: escrow_millis || 0,
            escrowAmount: escrow_amount || 0,
            unlisted: unlisted || false,
            private: is_private || false,
        };
    });
}
exports.createTribeChatParams = createTribeChatParams;
function addPendingContactIdsToChat(achat) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield models_1.models.ChatMember.findAll({ where: {
                chatId: achat.id,
                status: constants.chat_statuses.pending // only pending
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