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
const LND = require("../utils/lightning");
const signer = require("../utils/signer");
const msg_1 = require("../utils/msg");
const tribes = require("../utils/tribes");
const confirmations_1 = require("../controllers/confirmations");
const receive_1 = require("./receive");
const intercept = require("./intercept");
const constants_1 = require("../constants");
function sendMessage(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type, chat, message, sender, amount, success, failure, skipPubKey, isForwarded, realSatsContactId } = params;
        if (!chat || !sender)
            return;
        const isTribe = chat.type === constants_1.default.chat_types.tribe;
        let isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey;
        let theSender = (sender.dataValues || sender);
        if (isTribeOwner && !isForwarded) {
            theSender = Object.assign(Object.assign({}, (sender.dataValues || sender)), { role: constants_1.default.chat_roles.owner });
        }
        let msg = newmsg(type, chat, theSender, message, isForwarded);
        // console.log("=> MSG TO SEND",msg)
        // console.log(type,message)
        if (!(sender && sender.publicKey)) {
            console.log("NO SENDER?????");
            return;
        }
        let contactIds = (typeof chat.contactIds === 'string' ? JSON.parse(chat.contactIds) : chat.contactIds) || [];
        if (contactIds.length === 1) {
            if (contactIds[0] === 1) {
                if (success)
                    success(true);
                return; // if no contacts thats fine (like create public tribe)
            }
        }
        let networkType = undefined;
        const chatUUID = chat.uuid;
        if (isTribe) {
            if (type === constants_1.default.message_types.confirmation) {
                // if u are owner, go ahead!
                if (!isTribeOwner)
                    return; // dont send confs for tribe if not owner
            }
            if (isTribeOwner) {
                networkType = 'mqtt'; // broadcast to all
                // decrypt message.content and message.mediaKey w groupKey
                msg = yield msg_1.decryptMessage(msg, chat);
                // console.log("SEND.TS isBotMsg")
                const isBotMsg = yield intercept.isBotMsg(msg, true);
                if (isBotMsg === true) {
                    // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
                }
                // post last_active to tribes server
                tribes.putActivity(chat.uuid, chat.host);
            }
            else {
                // if tribe, send to owner only
                const tribeOwner = yield models_1.models.Contact.findOne({ where: { publicKey: chat.ownerPubkey } });
                contactIds = tribeOwner ? [tribeOwner.id] : [];
            }
        }
        let yes = true;
        let no = null;
        console.log('=> sending to', contactIds.length, 'contacts');
        yield asyncForEach(contactIds, (contactId) => __awaiter(this, void 0, void 0, function* () {
            if (contactId == 1) { // dont send to self
                return;
            }
            const contact = yield models_1.models.Contact.findOne({ where: { id: contactId } });
            if (!contact) {
                return; // skip if u simply dont have the contact
            }
            const destkey = contact.publicKey;
            if (destkey === skipPubKey) {
                return; // skip (for tribe owner broadcasting, not back to the sender)
            }
            // console.log('-> sending to ', contact.id, destkey)
            let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : '';
            // sending a payment to one subscriber, buying a pic from OG poster
            // or boost to og poster
            if (isTribeOwner && amount && realSatsContactId === contactId) {
                mqttTopic = ''; // FORCE KEYSEND!!!
            }
            const m = yield msg_1.personalizeMessage(msg, contact, isTribeOwner);
            // console.log('-> personalized msg',m)
            const opts = {
                dest: destkey,
                data: m,
                amt: Math.max((amount || 0), constants_1.default.min_sat_amount)
            };
            try {
                const r = yield signAndSend(opts, mqttTopic);
                yes = r;
            }
            catch (e) {
                console.log("KEYSEND ERROR", e);
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
function signAndSend(opts, mqttTopic, replayingHistory) {
    // console.log('sign and send!',opts)
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
            const sig = yield signer.signAscii(data);
            data = data + sig;
            // console.log("-> ACTUALLY SEND: topic:", mqttTopic)
            try {
                if (mqttTopic) {
                    yield tribes.publish(mqttTopic, data, function () {
                        if (!replayingHistory) {
                            if (mqttTopic)
                                checkIfAutoConfirm(opts.data);
                        }
                    });
                }
                else {
                    yield LND.keysendMessage(Object.assign(Object.assign({}, opts), { data }));
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
function checkIfAutoConfirm(data) {
    if (receive_1.typesToForward.includes(data.type)) {
        if (data.type === constants_1.default.message_types.delete) {
            return; // dont auto confirm delete msg
        }
        confirmations_1.tribeOwnerAutoConfirmation(data.message.id, data.chat.uuid);
    }
}
function newmsg(type, chat, sender, message, isForwarded) {
    const includeGroupKey = type === constants_1.default.message_types.group_create || type === constants_1.default.message_types.group_invite;
    const includeAlias = sender && sender.alias && chat.type === constants_1.default.chat_types.tribe;
    let aliasToInclude = sender.alias;
    if (!isForwarded && includeAlias && chat.myAlias) {
        aliasToInclude = chat.myAlias;
    }
    const includePhotoUrl = sender && !sender.privatePhoto && chat && chat.type === constants_1.default.chat_types.tribe;
    let photoUrlToInclude = sender.photoUrl || '';
    if (!isForwarded && includePhotoUrl && chat.myPhotoUrl) {
        photoUrlToInclude = chat.myPhotoUrl;
    }
    return {
        type: type,
        chat: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ uuid: chat.uuid }, chat.name && { name: chat.name }), (chat.type || chat.type === 0) && { type: chat.type }), chat.members && { members: chat.members }), (includeGroupKey && chat.groupKey) && { groupKey: chat.groupKey }), (includeGroupKey && chat.host) && { host: chat.host }),
        message: message,
        sender: Object.assign({ pub_key: sender.publicKey, alias: includeAlias ? aliasToInclude : '', role: sender.role || constants_1.default.chat_roles.reader }, includePhotoUrl && { photo_url: photoUrlToInclude })
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
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
// function urlBase64FromHex(ascii){
//     return Buffer.from(ascii,'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
// function urlBase64FromBytes(buf){
//     return Buffer.from(buf).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
//# sourceMappingURL=send.js.map