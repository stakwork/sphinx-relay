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
const models_1 = require("./models");
const md5 = require("md5");
const network = require("./network");
const constants = require('../config/constants.json');
const findOrCreateChat = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { chat_id, owner_id, recipient_id } = params;
    let chat;
    let date = new Date();
    date.setMilliseconds(0);
    if (chat_id) {
        chat = yield models_1.models.Chat.findOne({ where: { id: chat_id } });
        // console.log('findOrCreateChat: chat_id exists')
    }
    else {
        console.log("chat does not exists, create new");
        const owner = yield models_1.models.Contact.findOne({ where: { id: owner_id } });
        const recipient = yield models_1.models.Contact.findOne({ where: { id: recipient_id } });
        const uuid = md5([owner.publicKey, recipient.publicKey].sort().join("-"));
        // find by uuid
        chat = yield models_1.models.Chat.findOne({ where: { uuid } });
        if (!chat) { // no chat! create new
            chat = yield models_1.models.Chat.create({
                uuid: uuid,
                contactIds: JSON.stringify([parseInt(owner_id), parseInt(recipient_id)]),
                createdAt: date,
                updatedAt: date,
                type: constants.chat_types.conversation
            });
        }
    }
    return chat;
});
exports.findOrCreateChat = findOrCreateChat;
const sendContactKeys = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, contactIds, contactPubKey, sender, success, failure } = args;
    const msg = newkeyexchangemsg(type, sender);
    let yes = null;
    let no = null;
    let cids = contactIds;
    if (!contactIds)
        cids = [null]; // nully
    yield asyncForEach(cids, (contactId) => __awaiter(void 0, void 0, void 0, function* () {
        let destination_key;
        if (!contactId) { // nully
            destination_key = contactPubKey;
        }
        else {
            if (contactId == sender.id) {
                return;
            }
            const contact = yield models_1.models.Contact.findOne({ where: { id: contactId } });
            destination_key = contact.publicKey;
        }
        performKeysendMessage({
            sender,
            destination_key,
            amount: 3,
            msg,
            success: (data) => {
                yes = data;
            },
            failure: (error) => {
                no = error;
            }
        });
    }));
    if (no && failure) {
        failure(no);
    }
    if (!no && yes && success) {
        success(yes);
    }
});
exports.sendContactKeys = sendContactKeys;
const performKeysendMessage = ({ destination_key, amount, msg, success, failure, sender }) => __awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        dest: destination_key,
        data: msg || {},
        amt: Math.max(amount, 3)
    };
    try {
        const r = yield network.signAndSend(opts, sender.publicKey);
        console.log("=> external keysend");
        if (success)
            success(r);
    }
    catch (e) {
        console.log("MESSAGE ERROR", e);
        if (failure)
            failure(e);
    }
});
exports.performKeysendMessage = performKeysendMessage;
function findOrCreateContactByPubkey(senderPubKey) {
    return __awaiter(this, void 0, void 0, function* () {
        let sender = yield models_1.models.Contact.findOne({ where: { publicKey: senderPubKey } });
        if (!sender) {
            sender = yield models_1.models.Contact.create({
                publicKey: senderPubKey,
                alias: "Unknown",
                status: 1
            });
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            sendContactKeys({
                contactIds: [sender.id],
                sender: owner,
                type: constants.message_types.contact_key,
            });
        }
        return sender;
    });
}
exports.findOrCreateContactByPubkey = findOrCreateContactByPubkey;
function findOrCreateChatByUUID(chat_uuid, contactIds) {
    return __awaiter(this, void 0, void 0, function* () {
        let chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        if (!chat) {
            var date = new Date();
            date.setMilliseconds(0);
            chat = yield models_1.models.Chat.create({
                uuid: chat_uuid,
                contactIds: JSON.stringify(contactIds || []),
                createdAt: date,
                updatedAt: date,
                type: 0 // conversation
            });
        }
        return chat;
    });
}
exports.findOrCreateChatByUUID = findOrCreateChatByUUID;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
function parseReceiveParams(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = payload.content || payload;
        const sender_pub_key = dat.sender.pub_key;
        const sender_alias = dat.sender.alias;
        const chat_uuid = dat.chat.uuid;
        const chat_type = dat.chat.type;
        const chat_members = dat.chat.members || {};
        const chat_name = dat.chat.name;
        const chat_key = dat.chat.groupKey;
        const chat_host = dat.chat.host;
        const amount = dat.message.amount;
        const content = dat.message.content;
        const mediaToken = dat.message.mediaToken;
        const msg_id = dat.message.id || 0;
        const mediaKey = dat.message.mediaKey;
        const mediaType = dat.message.mediaType;
        const isTribeOwner = dat.isTribeOwner ? true : false;
        const isConversation = !chat_type || (chat_type && chat_type == constants.chat_types.conversation);
        let sender;
        let chat;
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        if (isConversation) {
            sender = yield findOrCreateContactByPubkey(sender_pub_key);
            chat = yield findOrCreateChatByUUID(chat_uuid, [parseInt(owner.id), parseInt(sender.id)]);
            if (sender.fromGroup === true) { // if a private msg received, update the contact
                yield sender.update({ fromGroup: false });
            }
        }
        else { // group
            sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key } });
            // inject a "sender" with an alias
            if (!sender && chat_type == constants.chat_types.tribe) {
                sender = { id: 0, alias: sender_alias };
            }
            chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        }
        return { owner, sender, chat, sender_pub_key, sender_alias, isTribeOwner, chat_uuid, amount, content, mediaToken, mediaKey, mediaType, chat_type, msg_id, chat_members, chat_name, chat_host, chat_key };
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
function newkeyexchangemsg(type, sender) {
    return {
        type: type,
        sender: Object.assign({ 
            // pub_key: sender.publicKey,
            contact_key: sender.contactKey }, sender.alias && { alias: sender.alias })
    };
}
//# sourceMappingURL=helpers.js.map