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
const path = require("path");
const lndService = require("../grpc");
const lightning_1 = require("../utils/lightning");
const controllers_1 = require("../controllers");
const tribes = require("../utils/tribes");
const lightning_2 = require("../utils/lightning");
const signer = require("../utils/signer");
const models_1 = require("../models");
const send_1 = require("./send");
const modify_1 = require("./modify");
// import {modifyPayloadAndSaveMediaKey} from './modify'
const msg_1 = require("../utils/msg");
const sequelize_1 = require("sequelize");
const timers = require("../utils/timers");
/*
delete type:
owner needs to check that the delete is the one who made the msg
in receiveDeleteMessage check the deleter is og sender?
*/
const constants = require(path.join(__dirname, '../../config/constants.json'));
const msgtypes = constants.message_types;
exports.typesToForward = [
    msgtypes.message, msgtypes.group_join, msgtypes.group_leave, msgtypes.attachment
];
const typesToModify = [
    msgtypes.attachment
];
const typesThatNeedPricePerMessage = [
    msgtypes.message, msgtypes.attachment
];
exports.typesToReplay = [
    msgtypes.message, msgtypes.group_join, msgtypes.group_leave
];
function onReceive(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        // if tribe, owner must forward to MQTT
        let doAction = true;
        const toAddIn = {};
        let isTribe = false;
        let isTribeOwner = false;
        let chat;
        if (payload.chat) {
            isTribe = payload.chat.type === constants.chat_types.tribe;
            chat = yield models_1.models.Chat.findOne({ where: { uuid: payload.chat.uuid } });
        }
        if (isTribe) {
            const tribeOwnerPubKey = chat && chat.ownerPubkey;
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            isTribeOwner = owner.publicKey === tribeOwnerPubKey;
        }
        if (isTribeOwner)
            toAddIn.isTribeOwner = true;
        if (isTribeOwner && exports.typesToForward.includes(payload.type)) {
            const needsPricePerJoin = typesThatNeedPricePerMessage.includes(payload.type);
            // CHECK THEY ARE IN THE GROUP if message
            const senderContact = yield models_1.models.Contact.findOne({ where: { publicKey: payload.sender.pub_key } });
            if (needsPricePerJoin) {
                const senderMember = senderContact && (yield models_1.models.ChatMember.findOne({ where: { contactId: senderContact.id, chatId: chat.id } }));
                if (!senderMember)
                    doAction = false;
            }
            // CHECK PRICES
            if (needsPricePerJoin) {
                if (payload.message.amount < chat.pricePerMessage)
                    doAction = false;
                if (chat.escrowAmount) {
                    timers.addTimer({
                        amount: chat.escrowAmount,
                        millis: chat.escrowMillis,
                        receiver: senderContact.id,
                        msgId: payload.message.id,
                        chatId: chat.id,
                    });
                }
            }
            // check price to join
            if (payload.type === msgtypes.group_join) {
                if (payload.message.amount < chat.priceToJoin)
                    doAction = false;
            }
            if (doAction)
                forwardMessageToTribe(payload, senderContact);
            else
                console.log('=> insufficient payment for this action');
        }
        if (isTribeOwner && payload.type === msgtypes.purchase) {
            const mt = payload.message.mediaToken;
            const host = mt && mt.split('.').length && mt.split('.')[0];
            const muid = mt && mt.split('.').length && mt.split('.')[1];
            const myAttachmentMessage = yield models_1.models.Message.findOne({ where: {
                    mediaToken: { [sequelize_1.Op.like]: `${host}.${muid}%` },
                    type: msgtypes.attachment, sender: 1,
                } });
            if (!myAttachmentMessage) { // someone else's attachment
                const senderContact = yield models_1.models.Contact.findOne({ where: { publicKey: payload.sender.pub_key } });
                modify_1.purchaseFromOriginalSender(payload, chat, senderContact);
                doAction = false;
            }
        }
        if (isTribeOwner && payload.type === msgtypes.purchase_accept) {
            const purchaserID = payload.message && payload.message.purchaser;
            const iAmPurchaser = purchaserID && purchaserID === 1;
            if (!iAmPurchaser) {
                const senderContact = yield models_1.models.Contact.findOne({ where: { publicKey: payload.sender.pub_key } });
                modify_1.sendFinalMemeIfFirstPurchaser(payload, chat, senderContact);
                doAction = false; // skip this! we dont need it
            }
        }
        if (doAction)
            doTheAction(Object.assign(Object.assign({}, payload), toAddIn));
    });
}
function doTheAction(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload = data;
        if (payload.isTribeOwner) {
            const ogContent = data.message && data.message.content;
            // const ogMediaKey = data.message && data.message.mediaKey
            /* decrypt and re-encrypt with phone's pubkey for storage */
            const chat = yield models_1.models.Chat.findOne({ where: { uuid: payload.chat.uuid } });
            const pld = yield msg_1.decryptMessage(data, chat);
            const me = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            payload = yield msg_1.encryptTribeBroadcast(pld, me, true); // true=isTribeOwner
            if (ogContent)
                payload.message.remoteContent = JSON.stringify({ 'chat': ogContent }); // this is the key
            //if(ogMediaKey) payload.message.remoteMediaKey = JSON.stringify({'chat':ogMediaKey})
        }
        if (controllers_1.ACTIONS[payload.type]) {
            controllers_1.ACTIONS[payload.type](payload);
        }
        else {
            console.log('Incorrect payload type:', payload.type);
        }
    });
}
function forwardMessageToTribe(ogpayload, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('forwardMessageToTribe', ogpayload);
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: ogpayload.chat.uuid } });
        console.log('chat.contactIds', chat.contactIds);
        let contactIds = JSON.parse(chat.contactIds || '[]');
        contactIds = contactIds.filter(cid => cid !== sender.id);
        console.log('contactIds', contactIds);
        if (contactIds.length === 0) {
            return; // totally skip if only send is in tribe
        }
        let payload;
        if (typesToModify.includes(ogpayload.type)) {
            payload = yield modify_1.modifyPayloadAndSaveMediaKey(ogpayload, chat, sender);
        }
        else {
            payload = ogpayload;
        }
        //const sender = await models.Contact.findOne({where:{publicKey:payload.sender.pub_key}})
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const type = payload.type;
        const message = payload.message;
        // HERE: NEED TO MAKE SURE ALIAS IS UNIQUE
        // ASK xref TABLE and put alias there too?
        send_1.sendMessage({
            type, message,
            sender: Object.assign(Object.assign({}, owner.dataValues), payload.sender && payload.sender.alias && { alias: payload.sender.alias }),
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds }),
            skipPubKey: payload.sender.pub_key,
            success: () => { },
            receive: () => { }
        });
    });
}
function initGrpcSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield lightning_1.getInfo();
            yield lndService.subscribeInvoices(parseKeysendInvoice);
        }
        catch (e) {
            throw e;
        }
    });
}
exports.initGrpcSubscriptions = initGrpcSubscriptions;
function initTribesSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        tribes.connect((topic, message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const msg = message.toString();
                // console.log("=====> msg received! TOPIC", topic, "MESSAGE", msg)
                // check topic is signed by sender?
                const payload = yield parseAndVerifyPayload(msg);
                onReceive(payload);
            }
            catch (e) { }
        }));
    });
}
exports.initTribesSubscriptions = initTribesSubscriptions;
// VERIFY PUBKEY OF SENDER from sig
function parseAndVerifyPayload(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload;
        const li = data.lastIndexOf('}');
        const msg = data.substring(0, li + 1);
        const sig = data.substring(li + 1);
        try {
            payload = JSON.parse(msg);
            if (payload && payload.sender && payload.sender.pub_key) {
                let v;
                if (sig.length === 96 && payload.sender.pub_key) { // => RM THIS 
                    v = yield signer.verifyAscii(msg, sig, payload.sender.pub_key);
                }
                if (v && v.valid) {
                    return payload;
                }
                else {
                    return payload; // => RM THIS
                }
            }
            else {
                return payload; // => RM THIS
            }
        }
        catch (e) {
            if (payload)
                return payload; // => RM THIS
            return null;
        }
    });
}
function parseKeysendInvoice(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records;
        const buf = recs && recs[lightning_2.SPHINX_CUSTOM_RECORD_KEY];
        const data = buf && buf.toString();
        const value = i && i.value && parseInt(i.value);
        if (!data)
            return;
        let payload;
        if (data[0] === '{') {
            try {
                payload = yield parseAndVerifyPayload(data);
            }
            catch (e) { }
        }
        else {
            const threads = weave(data);
            if (threads)
                payload = yield parseAndVerifyPayload(threads);
        }
        if (payload) {
            const dat = payload;
            if (value && dat && dat.message) {
                dat.message.amount = value; // ADD IN TRUE VALUE
            }
            onReceive(dat);
        }
    });
}
exports.parseKeysendInvoice = parseKeysendInvoice;
const chunks = {};
function weave(p) {
    const pa = p.split('_');
    if (pa.length < 4)
        return;
    const ts = pa[0];
    const i = pa[1];
    const n = pa[2];
    const m = pa.filter((u, i) => i > 2).join('_');
    chunks[ts] = chunks[ts] ? [...chunks[ts], { i, n, m }] : [{ i, n, m }];
    if (chunks[ts].length === parseInt(n)) {
        // got em all!
        const all = chunks[ts];
        let payload = '';
        all.slice().sort((a, b) => a.i - b.i).forEach(obj => {
            payload += obj.m;
        });
        delete chunks[ts];
        return payload;
    }
}
//# sourceMappingURL=receive.js.map