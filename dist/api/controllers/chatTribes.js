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
const tribes = require("../utils/tribes");
const path = require("path");
const msg_1 = require("../utils/msg");
const constants = require(path.join(__dirname, '../../config/constants.json'));
function joinTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> joinTribe');
        const { uuid, group_key, name, host, amount, img, owner_pubkey, owner_alias } = req.body;
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
        };
        network.sendMessage({
            chat: Object.assign(Object.assign({}, chatParams), { members: {
                    [owner.publicKey]: {
                        key: owner.contactKey,
                        alias: owner.alias || ''
                    }
                } }),
            amount: amount || 0,
            sender: owner,
            message: {},
            type: constants.message_types.group_join,
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
                    });
                    res_1.success(res, jsonUtils.chatToJson(chat));
                });
            }
        });
    });
}
exports.joinTribe = joinTribe;
function editTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, is_listed, price_per_message, price_to_join, img, description, tags, } = req.body;
        const { id } = req.params;
        if (!id)
            return res_1.failure(res, 'group id is required');
        const chat = yield models_1.models.Chat.findOne({ where: { id } });
        if (!chat) {
            return res_1.failure(res, 'cant find chat');
        }
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        let okToUpdate = true;
        if (is_listed) {
            try {
                yield tribes.edit({
                    uuid: chat.uuid,
                    name: name,
                    host: chat.host,
                    price_per_message: price_per_message || 0,
                    price_to_join: price_to_join || 0,
                    description,
                    tags,
                    img,
                    owner_alias: owner.alias,
                });
            }
            catch (e) {
                okToUpdate = false;
            }
        }
        if (okToUpdate) {
            yield chat.update({
                photoUrl: img || '',
                name: name,
                pricePerMessage: price_per_message || 0,
                priceToJoin: price_to_join || 0
            });
            res_1.success(res, jsonUtils.chatToJson(chat));
        }
        else {
            res_1.failure(res, 'failed to update tribe');
        }
    });
}
exports.editTribe = editTribe;
function replayChatHistory(chat, contact) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> test replay');
        if (!(chat && chat.id && contact && contact.id)) {
            console.log('[tribes] cant replay history');
        }
        const msgs = yield models_1.models.Message.findAll({
            where: { chatId: chat.id },
            order: [['id', 'asc']],
            limit: 40
        });
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        asyncForEach(msgs, (m) => __awaiter(this, void 0, void 0, function* () {
            console.log('==> msg', m.dataValues);
            const sender = Object.assign(Object.assign({}, owner.dataValues), m.senderAlias && { alias: m.senderAlias });
            let msg = network.newmsg(m.type, chat, sender, Object.assign(Object.assign(Object.assign({ content: m.remoteContent }, m.mediaKey && { mediaKey: m.mediaKey }), m.mediaType && { mediaType: m.mediaType }), m.mediaToken && { mediaToken: m.mediaToken }));
            msg = yield msg_1.decryptMessage(msg, chat);
            const data = yield msg_1.personalizeMessage(msg, contact, true);
            const mqttTopic = `${contact.publicKey}/${chat.uuid}`;
            console.log('replay ======>', mqttTopic, { data });
            //await network.signAndSend({data}, owner.publicKey, mqttTopic)
        }));
    });
}
exports.replayChatHistory = replayChatHistory;
function createTribeChatParams(owner, contactIds, name, img, price_per_message, price_to_join) {
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
        };
    });
}
exports.createTribeChatParams = createTribeChatParams;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=chatTribes.js.map