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
exports.checkMsgTypeInCache = exports.checkCache = exports.asyncForEach = exports.parseReceiveParams = exports.sleep = exports.findOrCreateChatByUUID = exports.findOrCreateContactByPubkeyAndRouteHint = exports.performKeysendMessage = exports.sendContactKeys = exports.findOrCreateChat = void 0;
const models_1 = require("./models");
const md5 = require("md5");
const network_1 = require("./network");
const constants_1 = require("./constants");
const logger_1 = require("./utils/logger");
const config_1 = require("./utils/config");
const config = (0, config_1.loadConfig)();
const findOrCreateChat = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { chat_id, owner_id, recipient_id } = params;
    // console.log("chat_id, owner_id, recipient_id", chat_id, owner_id, recipient_id)
    let chat;
    const date = new Date();
    date.setMilliseconds(0);
    // console.log("findOrCreateChat", chat_id, typeof chat_id, owner_id, typeof owner_id)
    if (chat_id) {
        chat = (yield models_1.models.Chat.findOne({
            where: { id: chat_id, tenant: owner_id },
        }));
        // console.log('findOrCreateChat: chat_id exists')
    }
    else {
        if (!owner_id || !recipient_id)
            return;
        logger_1.sphinxLogger.info(`chat does not exists, create new`);
        const owner = (yield models_1.models.Contact.findOne({
            where: { id: owner_id },
        }));
        const recipient = (yield models_1.models.Contact.findOne({
            where: { id: recipient_id, tenant: owner_id },
        }));
        const uuid = md5([owner.publicKey, recipient.publicKey].sort().join('-'));
        // find by uuid
        chat = (yield models_1.models.Chat.findOne({
            where: { uuid, tenant: owner_id, deleted: false },
        }));
        if (!chat) {
            // no chat! create new
            logger_1.sphinxLogger.info(`=> no chat! create new`);
            chat = (yield models_1.models.Chat.create({
                uuid: uuid,
                contactIds: JSON.stringify([owner_id, recipient_id]),
                createdAt: date,
                updatedAt: date,
                type: constants_1.default.chat_types.conversation,
                tenant: owner_id,
            }));
        }
    }
    return chat;
});
exports.findOrCreateChat = findOrCreateChat;
const sendContactKeys = ({ type, contactIds, sender, success, failure, dontActuallySendContactKey, contactPubKey, routeHint, }) => __awaiter(void 0, void 0, void 0, function* () {
    const msg = newkeyexchangemsg(type, sender, dontActuallySendContactKey || false);
    if (contactPubKey) {
        // dont use ids here
        (0, exports.performKeysendMessage)({
            sender,
            destination_key: contactPubKey,
            amount: 3,
            msg,
            route_hint: routeHint,
            success,
            failure,
        });
        return;
    }
    let yes = null;
    let no = null;
    const cids = contactIds || [];
    yield asyncForEach(cids, (contactId) => __awaiter(void 0, void 0, void 0, function* () {
        if (contactId == sender.id) {
            return;
        }
        const contact = (yield models_1.models.Contact.findOne({
            where: { id: contactId },
        }));
        if (!(contact && contact.publicKey))
            return;
        const destination_key = contact.publicKey;
        const route_hint = contact.routeHint;
        // console.log("=> KEY EXCHANGE", msg)
        // console.log("=> TO", destination_key, route_hint)
        yield (0, exports.performKeysendMessage)({
            sender,
            destination_key,
            amount: 3,
            msg,
            route_hint,
            success: (data) => {
                yes = data;
            },
            failure: (error) => {
                no = error;
            },
        });
        yield sleep(1000);
    }));
    if (no && failure) {
        failure(no);
    }
    if (!no && yes && success) {
        success(yes);
    }
});
exports.sendContactKeys = sendContactKeys;
const performKeysendMessage = ({ destination_key, route_hint, amount, msg, success, failure, sender, extra_tlv, }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!destination_key) {
        if (failure)
            failure(new Error('=> no destination_key'));
        return;
    }
    const opts = {
        dest: destination_key,
        data: msg || {},
        amt: Math.max(amount, 3),
        route_hint,
        extra_tlv,
    };
    try {
        const r = yield (0, network_1.signAndSend)(opts, sender);
        // console.log("=> keysend to new contact")
        if (success)
            success(r);
    }
    catch (e) {
        logger_1.sphinxLogger.info(`KEYSEND MESSAGE ERROR to ${destination_key} ${e} ${opts}`, logger_1.logging.Network);
        if (failure)
            failure(e);
    }
});
exports.performKeysendMessage = performKeysendMessage;
function findOrCreateContactByPubkeyAndRouteHint(senderPubKey, senderRouteHint, senderAlias, owner, realAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        let sender = (yield models_1.models.Contact.findOne({
            where: { publicKey: senderPubKey, tenant: owner.id },
        }));
        if (!sender) {
            let unmet = false;
            if (owner.priceToMeet) {
                if (realAmount < owner.priceToMeet)
                    unmet = true;
            }
            sender = (yield models_1.models.Contact.create({
                publicKey: senderPubKey,
                routeHint: senderRouteHint || '',
                alias: senderAlias || 'Unknown',
                status: 1,
                tenant: owner.id,
                unmet,
            }));
            (0, exports.sendContactKeys)({
                contactIds: [sender.id],
                sender: owner,
                type: constants_1.default.message_types.contact_key,
            });
        }
        else {
            if (sender.unmet) {
                // update "unmet" if they pay enough second time
                if (owner.priceToMeet && realAmount >= owner.priceToMeet) {
                    yield sender.update({ unmet: false });
                }
            }
        }
        return sender;
    });
}
exports.findOrCreateContactByPubkeyAndRouteHint = findOrCreateContactByPubkeyAndRouteHint;
function findOrCreateChatByUUID(chat_uuid, contactIds, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        let chat = (yield models_1.models.Chat.findOne({
            where: { uuid: chat_uuid, tenant, deleted: false },
        }));
        if (!chat) {
            const date = new Date();
            date.setMilliseconds(0);
            chat = (yield models_1.models.Chat.create({
                uuid: chat_uuid,
                contactIds: JSON.stringify(contactIds || []),
                createdAt: date,
                updatedAt: date,
                type: 0,
                tenant,
            }));
        }
        return chat;
    });
}
exports.findOrCreateChatByUUID = findOrCreateChatByUUID;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
function parseReceiveParams(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = payload;
        const sender_pub_key = dat.sender.pub_key;
        const sender_route_hint = dat.sender.route_hint;
        const sender_alias = dat.sender.alias;
        const sender_photo_url = dat.sender.photo_url || '';
        const chat_uuid = dat.chat.uuid;
        const chat_type = dat.chat.type;
        const chat_members = dat.chat.members || {};
        const chat_name = dat.chat.name;
        const chat_key = dat.chat.groupKey;
        const chat_host = dat.chat.host;
        const amount = dat.message.amount;
        const content = dat.message.content;
        const remote_content = dat.message.remoteContent;
        const message_status = dat.message.status;
        const mediaToken = dat.message.mediaToken;
        const originalMuid = dat.message.originalMuid;
        const msg_id = dat.message.id || 0;
        const msg_uuid = dat.message.uuid || '';
        const mediaKey = dat.message.mediaKey;
        const mediaType = dat.message.mediaType;
        const date_string = dat.message.date;
        const skip_payment_processing = dat.message.skipPaymentProcessing;
        const reply_uuid = dat.message.replyUuid;
        const parent_id = dat.message.parentId;
        const purchaser_id = dat.message.purchaser;
        const force_push = dat.message.push;
        const network_type = dat.network_type || 0;
        const isTribeOwner = dat.isTribeOwner ? true : false;
        const hasForwardedSats = dat.hasForwardedSats ? true : false;
        const dest = dat.dest;
        const recipient_alias = dat.message.recipientAlias;
        const recipient_pic = dat.message.recipientPic;
        const person = dat.sender.person;
        const isConversation = !chat_type || (chat_type && chat_type == constants_1.default.chat_types.conversation);
        let sender;
        let chat;
        let owner = dat.owner;
        if (!owner) {
            const ownerRecord = (yield models_1.models.Contact.findOne({
                where: { isOwner: true, publicKey: dest },
            }));
            owner = ownerRecord.dataValues;
        }
        if (!owner)
            logger_1.sphinxLogger.error(`=> parseReceiveParams cannot find owner`);
        if (isConversation) {
            const realAmount = network_type === constants_1.default.network_types.lightning ? amount : 0;
            sender = yield findOrCreateContactByPubkeyAndRouteHint(sender_pub_key, sender_route_hint, sender_alias, owner, realAmount);
            chat = yield findOrCreateChatByUUID(chat_uuid, [owner.id, sender.id], owner.id);
            if (sender.fromGroup) {
                // if a private msg received, update the contact
                yield sender.update({ fromGroup: false });
            }
        }
        else {
            // group
            sender = (yield models_1.models.Contact.findOne({
                where: { publicKey: sender_pub_key, tenant: owner.id },
            }));
            // inject a "sender" with an alias
            if (!sender && chat_type == constants_1.default.chat_types.tribe) {
                sender = { id: 0, alias: sender_alias };
            }
            chat = (yield models_1.models.Chat.findOne({
                where: { uuid: chat_uuid, tenant: owner.id },
            }));
        }
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        const tribeOwner = isTribe && (chat === null || chat === void 0 ? void 0 : chat.ownerPubkey) === (owner === null || owner === void 0 ? void 0 : owner.publicKey);
        let existInCache = checkMsgTypeInCache(payload.type);
        const cached = existInCache && !tribeOwner && (chat === null || chat === void 0 ? void 0 : chat.preview) ? true : false;
        return {
            owner: owner,
            dest,
            sender,
            chat,
            sender_pub_key,
            sender_route_hint,
            sender_alias,
            isTribeOwner,
            hasForwardedSats,
            chat_uuid,
            amount,
            content,
            mediaToken,
            mediaKey,
            mediaType,
            originalMuid,
            chat_type,
            msg_id,
            chat_members,
            chat_name,
            chat_host,
            chat_key,
            remote_content,
            msg_uuid,
            date_string,
            reply_uuid,
            parent_id,
            skip_payment_processing,
            purchaser_id,
            sender_photo_url,
            network_type,
            message_status,
            force_push,
            recipient_alias,
            recipient_pic,
            person,
            cached,
        };
    });
}
exports.parseReceiveParams = parseReceiveParams;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
exports.asyncForEach = asyncForEach;
function newkeyexchangemsg(type, sender, dontActuallySendContactKey) {
    const includePhotoUrl = sender && sender.photoUrl && !sender.privatePhoto;
    return {
        type: type,
        sender: Object.assign(Object.assign(Object.assign(Object.assign({ pub_key: sender.publicKey }, (sender.routeHint && { route_hint: sender.routeHint })), (!dontActuallySendContactKey && { contact_key: sender.contactKey })), (sender.alias && { alias: sender.alias })), (includePhotoUrl && { photo_url: sender.photoUrl })),
    };
}
function checkCache() {
    const store_cache = config.store_cache;
    if (typeof store_cache === 'string' &&
        store_cache &&
        store_cache.length > 0) {
        return true;
    }
    return false;
}
exports.checkCache = checkCache;
function checkMsgTypeInCache(msgType) {
    const msgTypeInCache = checkCache() && config.store_cache.split(',');
    if (msgTypeInCache) {
        for (let i = 0; i < msgTypeInCache.length; i++) {
            const type = parseInt(msgTypeInCache[i]);
            if (type === msgType) {
                return true;
            }
        }
    }
    return false;
}
exports.checkMsgTypeInCache = checkMsgTypeInCache;
//# sourceMappingURL=helpers.js.map