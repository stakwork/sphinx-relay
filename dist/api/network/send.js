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
const path = require("path");
const tribes = require("../utils/tribes");
const confirmations_1 = require("../controllers/confirmations");
const receive_1 = require("./receive");
const intercept = require("./intercept");
const constants = require(path.join(__dirname, '../../config/constants.json'));
const MIN_SATS = 3;
function sendMessage(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type, chat, message, sender, amount, success, failure, skipPubKey } = params;
        let msg = newmsg(type, chat, sender, message);
        console.log("=> MSG TO SEND", msg);
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
        const isTribe = chat.type === constants.chat_types.tribe;
        let isTribeOwner = false;
        const chatUUID = chat.uuid;
        if (isTribe) {
            const tribeOwnerPubKey = chat.ownerPubkey;
            isTribeOwner = sender.publicKey === tribeOwnerPubKey;
            if (type === constants.message_types.confirmation) {
                // if u are owner, go ahead!
                if (!isTribeOwner)
                    return; // dont send confs for tribe if not owner
            }
            if (isTribeOwner) {
                networkType = 'mqtt'; // broadcast to all
                // decrypt message.content and message.mediaKey w groupKey
                msg = yield msg_1.decryptMessage(msg, chat);
                const isBotMsg = yield intercept.isBotMsg(msg, true);
                if (isBotMsg === true) {
                    // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead
                }
                // post last_active to tribes server
                tribes.putActivity(chat.uuid, chat.host);
            }
            else {
                // if tribe, send to owner only
                const tribeOwner = yield models_1.models.Contact.findOne({ where: { publicKey: tribeOwnerPubKey } });
                contactIds = tribeOwner ? [tribeOwner.id] : [];
            }
        }
        let yes = true;
        let no = null;
        console.log('all contactIds', contactIds);
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
            console.log('-> sending to ', contact.id, destkey);
            let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : '';
            // sending a payment to one subscriber (like buying a pic)
            if (isTribeOwner && contactIds.length === 1 && amount && amount > MIN_SATS) {
                mqttTopic = ''; // FORCE KEYSEND!!!
            }
            const m = yield msg_1.personalizeMessage(msg, contact, isTribeOwner);
            const opts = {
                dest: destkey,
                data: m,
                amt: Math.max((amount || 0), MIN_SATS)
            };
            try {
                const r = yield signAndSend(opts, mqttTopic);
                yes = r;
            }
            catch (e) {
                console.log("KEYSEND ERROR", e);
                no = e;
            }
            yield sleep(2);
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
            // console.log("ACTUALLY SEND", mqttTopic)
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
        if (data.type === constants.message_types.delete) {
            return; // dont auto confirm delete msg
        }
        confirmations_1.tribeOwnerAutoConfirmation(data.message.id, data.chat.uuid);
    }
}
function newmsg(type, chat, sender, message) {
    const includeGroupKey = type === constants.message_types.group_create || type === constants.message_types.group_invite;
    const includeAlias = sender && sender.alias && chat.type === constants.chat_types.tribe;
    // const includePhotoUrl = sender && sender.photoUrl && !sender.privatePhoto
    return {
        type: type,
        chat: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ uuid: chat.uuid }, chat.name && { name: chat.name }), (chat.type || chat.type === 0) && { type: chat.type }), chat.members && { members: chat.members }), (includeGroupKey && chat.groupKey) && { groupKey: chat.groupKey }), (includeGroupKey && chat.host) && { host: chat.host }),
        message: message,
        sender: {
            pub_key: sender.publicKey,
            alias: includeAlias ? sender.alias : '',
        }
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