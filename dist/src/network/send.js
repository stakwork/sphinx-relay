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
exports.detectMentionsForTribeAdminSelf = exports.newmsg = exports.signAndSend = exports.sendMessage = void 0;
const models_1 = require("../models");
const LND = require("../grpc/lightning");
const msg_1 = require("../utils/msg");
const tribes = require("../utils/tribes");
const confirmations_1 = require("../controllers/confirmations");
const receive_1 = require("./receive");
const intercept = require("./intercept");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
function sendMessage({ type, chat, message, sender, amount, success, failure, skipPubKey, isForwarded, forwardedFromContactId, realSatsContactId, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!chat || !sender)
            return;
        const tenant = sender.id;
        if (!tenant)
            return;
        const isTribe = chat.type === constants_1.default.chat_types.tribe;
        const isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey;
        // console.log('-> sender.publicKey', sender.publicKey)
        // console.log('-> chat.ownerPubkey', chat.ownerPubkey)
        let aSender = sender;
        if (sender.dataValues) {
            aSender = sender.dataValues;
        }
        const theSender = aSender;
        // let theSender: ContactRecord = (sender.dataValues || sender) as ContactRecord
        if (isTribeOwner && !isForwarded) {
            theSender.role = constants_1.default.chat_roles.owner;
        }
        let msg = newmsg(type, chat, theSender, message, isForwarded ? true : false);
        // console.log("=> MSG TO SEND",msg)
        // console.log(type,message)
        if (!(sender && sender.publicKey)) {
            // console.log("NO SENDER?????");
            return;
        }
        let contactIds = (typeof chat.contactIds === 'string'
            ? JSON.parse(chat.contactIds)
            : chat.contactIds) || [];
        let justMe = false;
        if (contactIds.length === 1) {
            if (contactIds[0] === tenant) {
                // JUST ME!
                justMe = true;
            }
        }
        let networkType = undefined;
        const chatUUID = chat.uuid;
        let mentionContactIds = [];
        if (isTribe) {
            if (type === constants_1.default.message_types.confirmation) {
                // if u are owner, go ahead!
                if (!isTribeOwner)
                    return; // dont send confs for tribe if not owner
            }
            if (isTribeOwner) {
                networkType = 'mqtt'; // broadcast to all
                // decrypt message.content and message.mediaKey w groupKey
                msg = yield (0, msg_1.decryptMessage)(msg, chat);
                // console.log("SEND.TS isBotMsg")
                logger_1.sphinxLogger.info(`[Network] => isTribeAdmin msg sending... ${msg}`, logger_1.logging.Network);
                const isBotMsg = yield intercept.isBotMsg(msg, true, sender, forwardedFromContactId);
                if (isBotMsg === true) {
                    logger_1.sphinxLogger.info(`[Network] => isBotMsg`, logger_1.logging.Network);
                    // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
                }
                mentionContactIds = yield detectMentions(msg, isForwarded ? true : false, chat.id, tenant);
            }
            // stop here if just me
            if (justMe) {
                if (success)
                    success(true);
                return; // if no contacts thats fine (like create public tribe)
            }
            if (isTribeOwner) {
                try {
                    // post last_active to tribes server
                    if (chat.uuid && chat.host) {
                        tribes.putActivity(chat.uuid, chat.host, sender.publicKey);
                    }
                }
                catch (e) {
                    logger_1.sphinxLogger.error('failed to tribes.putActivity', logger_1.logging.Network);
                }
            }
            else {
                // if tribe, send to owner only
                const tribeOwner = (yield models_1.models.Contact.findOne({
                    where: { publicKey: chat.ownerPubkey, tenant },
                }));
                contactIds = tribeOwner ? [tribeOwner.id] : [];
            }
        }
        else {
            // not a tribe
            if (justMe) {
                if (success)
                    success(true);
                return;
            }
        }
        let yes = true;
        let no = null;
        logger_1.sphinxLogger.info(`=> sending to ${contactIds.length} 'contacts'`, logger_1.logging.Network);
        yield asyncForEach(contactIds, (contactId) => __awaiter(this, void 0, void 0, function* () {
            // console.log("=> TENANT", tenant)
            if (contactId === tenant) {
                // dont send to self
                // console.log('=> dont send to self')
                return;
            }
            const contact = (yield models_1.models.Contact.findOne({
                where: { id: contactId },
            }));
            if (!contact) {
                // console.log('=> sendMessage no contact')
                return; // skip if u simply dont have the contact
            }
            if (tenant === -1) {
                // this is a bot sent from me!
                if (contact.isOwner) {
                    // console.log('=> dont MQTT to myself!')
                    return; // dont MQTT to myself!
                }
            }
            // console.log("=> CONTACT", contactId, contact.publicKey)
            const destkey = contact.publicKey;
            if (destkey === skipPubKey) {
                // console.log('=> skipPubKey', skipPubKey)
                return; // skip (for tribe owner broadcasting, not back to the sender)
            }
            // console.log('-> sending to ', contact.id, destkey)
            let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : '';
            // sending a payment to one subscriber, buying a pic from OG poster
            // or boost to og poster
            // console.log("=> istribeOwner", isTribeOwner)
            // console.log("=> amount", amount)
            // console.log("=> realSatsContactId", realSatsContactId, contactId)
            if (isTribeOwner && amount && realSatsContactId === contactId) {
                mqttTopic = ''; // FORCE KEYSEND!!!
            }
            const m = yield (0, msg_1.personalizeMessage)(msg, contact, isTribeOwner);
            // send a "push", the user was mentioned
            if (mentionContactIds.includes(contact.id) ||
                mentionContactIds.includes(Infinity)) {
                m.message.push = true;
            }
            // console.log('-> personalized msg', m)
            const opts = {
                dest: destkey,
                data: m,
                amt: Math.max(amount || 0, constants_1.default.min_sat_amount),
                route_hint: contact.routeHint || '',
            };
            // console.log("==> SENDER",sender)
            // console.log("==> OK SIGN AND SEND", opts);
            try {
                const r = yield signAndSend(opts, sender, mqttTopic);
                yes = r;
            }
            catch (e) {
                logger_1.sphinxLogger.error(`KEYSEND ERROR ${e}`);
                no = e;
            }
            yield sleep(10);
        }));
        if (no) {
            if (failure)
                failure(no);
        }
        else {
            if (success)
                success(yes);
        }
    });
}
exports.sendMessage = sendMessage;
function signAndSend(opts, owner, mqttTopic, replayingHistory) {
    // console.log('sign and send!',opts)
    const ownerPubkey = owner.publicKey;
    const ownerID = owner.id;
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!opts || typeof opts !== 'object') {
                return reject('object plz');
            }
            if (!opts.dest) {
                return reject('no dest pubkey');
            }
            let data = JSON.stringify(opts.data || {});
            opts.amt = opts.amt || 0;
            const sig = yield LND.signAscii(data, ownerPubkey);
            data = data + sig;
            // console.log("-> ACTUALLY SEND: topic:", mqttTopic)
            try {
                if (mqttTopic) {
                    yield tribes.publish(mqttTopic, data, ownerPubkey, () => {
                        if (!replayingHistory) {
                            if (mqttTopic)
                                checkIfAutoConfirm(opts.data, ownerID);
                        }
                    });
                }
                else {
                    yield LND.keysendMessage(Object.assign(Object.assign({}, opts), { data }), ownerPubkey);
                }
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.signAndSend = signAndSend;
function checkIfAutoConfirm(data, tenant) {
    if (receive_1.typesToForward.includes(data.type)) {
        if (data.type === constants_1.default.message_types.delete) {
            return; // dont auto confirm delete msg
        }
        (0, confirmations_1.tribeOwnerAutoConfirmation)(data.message.id, data.chat.uuid, tenant);
    }
}
function newmsg(type, chat, sender, message, isForwarded, includeStatus) {
    const includeGroupKey = type === constants_1.default.message_types.group_create ||
        type === constants_1.default.message_types.group_invite;
    const includeAlias = sender && sender.alias && chat.type === constants_1.default.chat_types.tribe;
    let aliasToInclude = sender.alias;
    if (!isForwarded && includeAlias && chat.myAlias) {
        aliasToInclude = chat.myAlias;
    }
    const includePhotoUrl = sender &&
        !sender.privatePhoto &&
        chat &&
        chat.type === constants_1.default.chat_types.tribe;
    let photoUrlToInclude = sender.photoUrl || '';
    if (!isForwarded && includePhotoUrl && chat.myPhotoUrl) {
        photoUrlToInclude = chat.myPhotoUrl;
    }
    if (!includeStatus && message.status) {
        delete message.status;
    }
    return {
        type: type,
        chat: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ uuid: chat.uuid }, (chat.name && { name: chat.name })), ((chat.type || chat.type === 0) && { type: chat.type })), (chat.members && { members: chat.members })), (includeGroupKey && chat.groupKey && { groupKey: chat.groupKey })), (includeGroupKey && chat.host && { host: chat.host })),
        message: message,
        sender: Object.assign(Object.assign(Object.assign({ pub_key: sender.publicKey }, (sender.routeHint && { route_hint: sender.routeHint })), { alias: includeAlias ? aliasToInclude : '', role: sender.role || constants_1.default.chat_roles.reader }), (includePhotoUrl && { photo_url: photoUrlToInclude })),
    };
}
exports.newmsg = newmsg;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
// function urlBase64FromHex(ascii){
//     return Buffer.from(ascii,'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
// function urlBase64FromBytes(buf){
//     return Buffer.from(buf).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
function detectMentions(msg, isForwarded, chatId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = msg.message.content;
        if (content) {
            const mentions = parseMentions(content);
            if (mentions.includes('@all') && !isForwarded)
                return [Infinity];
            const ret = [];
            const allMembers = (yield models_1.models.ChatMember.findAll({
                where: { tenant, chatId },
            }));
            yield asyncForEach(mentions, (men) => __awaiter(this, void 0, void 0, function* () {
                const lastAlias = men.substring(1);
                // check chat memberss
                const member = allMembers.find((m) => {
                    if (m.lastAlias && lastAlias) {
                        return m.lastAlias.toLowerCase() === lastAlias.toLowerCase();
                    }
                });
                if (member) {
                    ret.push(member.contactId);
                }
            }));
            return ret;
        }
        else {
            return [];
        }
    });
}
function parseMentions(content) {
    const words = content.split(' ');
    return words.filter((w) => w.startsWith('@'));
}
function detectMentionsForTribeAdminSelf(msg, tenant, myAlias) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('======> detectMentionsForTribeAdminSelf');
        const content = msg.message.content;
        console.log('======> content', content);
        if (!content)
            return false;
        const mentions = parseMentions(content);
        console.log('======> mentionds ', mentions);
        if (mentions.includes('@all'))
            return true;
        let ret = false;
        const owner = (yield models_1.models.Contact.findOne({
            where: { tenant, isOwner: true },
        }));
        yield asyncForEach(mentions, (men) => __awaiter(this, void 0, void 0, function* () {
            const lastAlias = men.substring(1);
            console.log('====> last alias', lastAlias);
            if (lastAlias) {
                console.log('my alias', myAlias);
                if (myAlias) {
                    // admin's own alias for tribe
                    if (myAlias.toLowerCase() === lastAlias.toLowerCase()) {
                        ret = true;
                    }
                }
                else if (owner.alias) {
                    console.log('owern aliad', owner.alias);
                    // or owner's default alias
                    if (owner.alias.toLowerCase() === lastAlias.toLowerCase()) {
                        ret = true;
                    }
                }
            }
        }));
        return ret;
    });
}
exports.detectMentionsForTribeAdminSelf = detectMentionsForTribeAdminSelf;
//# sourceMappingURL=send.js.map