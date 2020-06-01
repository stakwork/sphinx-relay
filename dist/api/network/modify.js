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
const fetch = require("node-fetch");
const ldat_1 = require("../utils/ldat");
const rsa = require("../crypto/rsa");
const crypto = require("crypto");
const meme = require("../utils/meme");
const FormData = require("form-data");
const models_1 = require("../models");
const RNCryptor = require("jscryptor");
const send_1 = require("./send");
const sequelize_1 = require("sequelize");
const constants = require(path.join(__dirname, '../../config/constants.json'));
const msgtypes = constants.message_types;
function modifyPayloadAndSaveMediaKey(payload, chat, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type !== msgtypes.attachment)
            return payload;
        try {
            const ret = yield downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender);
            return fillmsg(payload, ret); // key is re-encrypted later
        }
        catch (e) {
            console.log("[modify] error", e);
            return payload;
        }
    });
}
exports.modifyPayloadAndSaveMediaKey = modifyPayloadAndSaveMediaKey;
// "purchase" type
function purchaseFromOriginalSender(payload, chat, purchaser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type !== msgtypes.purchase)
            return;
        const mt = payload.message && payload.message.mediaToken;
        const amount = payload.message.amount;
        const muid = mt && mt.split('.').length && mt.split('.')[1];
        if (!muid)
            return;
        const mediaKey = yield models_1.models.MediaKey.findOne({ where: { originalMuid: muid } });
        const terms = ldat_1.parseLDAT(mt);
        let price = terms.meta && terms.meta.amt;
        if (amount < price)
            return; // not enough sats
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        if (mediaKey) { // ALREADY BEEN PURHCASED! simply send
            console.log("MEDIA KEY EXISTS ALREADY", mediaKey);
            // send back the new mediaToken and key
            const mediaTerms = {
                muid, ttl: 31536000, host: '',
                meta: Object.assign({}, amount && { amt: amount }),
            };
            // send full new key and token
            const msg = { mediaTerms, mediaKey: mediaKey.key };
            console.log("SEND PURCHASE ACCEPT FROM STORED KEY");
            send_1.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [purchaser.id] }),
                sender: owner,
                type: constants.message_types.purchase_accept,
                message: msg,
                success: () => { },
                failure: () => { }
            });
        }
        else {
            console.log("NO MEDIA KEY EXISTS YET");
            const ogmsg = yield models_1.models.Message.findOne({ where: { chatId: chat.id, mediaToken: mt } });
            // purchase it from creator (send "purchase")
            const msg = { amount, mediaToken: mt };
            console.log("GO AHEARD AND BUY!!! from:", ogmsg.sender, {
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [ogmsg.sender] }),
                sender: Object.assign(Object.assign({}, owner.dataValues), purchaser && purchaser.alias && { alias: purchaser.alias }),
                type: constants.message_types.purchase,
                message: msg,
                amount: amount,
                success: () => { },
                failure: () => { }
            });
            send_1.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [ogmsg.sender] }),
                sender: Object.assign(Object.assign({}, owner.dataValues), purchaser && purchaser.alias && { alias: purchaser.alias }),
                type: constants.message_types.purchase,
                message: msg,
                amount: amount,
                success: () => { },
                failure: () => { }
            });
        }
    });
}
exports.purchaseFromOriginalSender = purchaseFromOriginalSender;
function sendFinalMemeIfFirstPurchaser(payload, chat, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type !== msgtypes.purchase_accept)
            return;
        console.log("PURCHASE ACCEPT!!!!!");
        const mt = payload.message && payload.message.mediaToken;
        const typ = payload.message && payload.message.mediaType;
        if (!mt)
            return;
        const muid = mt && mt.split('.').length && mt.split('.')[1];
        if (!muid)
            return;
        const existingMediaKey = yield models_1.models.MediaKey.findOne({ where: { muid } });
        if (existingMediaKey)
            return; // no need, its already been sent
        const host = mt.split('.')[0];
        const ogPurchaseMessage = yield models_1.models.Message.findOne({ where: {
                mediaToken: { [sequelize_1.Op.like]: `${host}.${muid}%` },
                type: msgtypes.purchase,
            } });
        const termsAndKey = yield downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender, ogPurchaseMessage.amount);
        console.log('ogPurchaseMessage', ogPurchaseMessage.dataValues);
        // send it to the purchaser
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        console.log("SEND firST PURHCASE ACCEPT MSG!");
        send_1.sendMessage({
            sender: Object.assign(Object.assign({}, owner.dataValues), sender && sender.alias && { alias: sender.alias }),
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [ogPurchaseMessage.sender] }),
            type: msgtypes.purchase_accept,
            message: Object.assign(Object.assign({}, termsAndKey), { mediaType: typ }),
            success: () => { },
            receive: () => { }
        });
    });
}
exports.sendFinalMemeIfFirstPurchaser = sendFinalMemeIfFirstPurchaser;
function fillmsg(full, props) {
    return Object.assign(Object.assign({}, full), { message: Object.assign(Object.assign({}, full.message), props) });
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
function downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender, injectedAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const mt = payload.message && payload.message.mediaToken;
        const key = payload.message && payload.message.mediaKey;
        const typ = payload.message && payload.message.mediaType;
        if (!mt || !key)
            return payload; // save anyway??????????
        const ogmuid = mt && mt.split('.').length && mt.split('.')[1];
        const terms = ldat_1.parseLDAT(mt);
        if (!terms.host)
            return payload;
        try {
            const r = yield fetch(`https://${terms.host}/file/${mt}`, {
                headers: { 'Authorization': `Bearer ${meme.mediaToken}` }
            });
            const buf = yield r.buffer();
            const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key);
            const imgBuf = RNCryptor.Decrypt(buf.toString('base64'), decMediaKey);
            const newKey = crypto.randomBytes(20).toString('hex');
            const encImgBase64 = RNCryptor.Encrypt(imgBuf, newKey);
            var encImgBuffer = Buffer.from(encImgBase64, 'base64');
            const form = new FormData();
            form.append('file', encImgBuffer, {
                contentType: typ || 'image/jpg',
                filename: 'Image.jpg',
                knownLength: encImgBuffer.length,
            });
            const formHeaders = form.getHeaders();
            const resp = yield fetch(`https://${terms.host}/file`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, formHeaders), { 'Authorization': `Bearer ${meme.mediaToken}` }),
                body: form
            });
            let json = yield resp.json();
            if (!json.muid)
                throw new Error('no muid');
            // PUT NEW TERMS, to finish in personalizeMessage
            const amt = (terms.meta && terms.meta.amt) || injectedAmount;
            const ttl = terms.meta && terms.meta.ttl;
            const mediaTerms = {
                muid: json.muid, ttl: ttl || 31536000, host: '',
                meta: Object.assign({}, amt && { amt }),
                skipSigning: amt ? true : false // only sign if its free
            };
            const encKey = rsa.encrypt(chat.groupKey, newKey.slice());
            var date = new Date();
            date.setMilliseconds(0);
            console.log('[modify] save media key!', {
                muid: json.muid,
                chatId: chat.id,
                key: encKey,
                messageId: (payload.message && payload.message.id) || 0,
                receiver: 0,
                sender: sender.id,
                createdAt: date,
            });
            yield sleep(1);
            yield models_1.models.MediaKey.create({
                muid: json.muid,
                chatId: chat.id,
                key: encKey,
                messageId: (payload.message && payload.message.id) || 0,
                receiver: 0,
                sender: sender.id,
                createdAt: date,
                originalMuid: ogmuid,
            });
            return { mediaTerms, mediaKey: encKey };
        }
        catch (e) {
            throw e;
        }
    });
}
exports.downloadAndUploadAndSaveReturningTermsAndKey = downloadAndUploadAndSaveReturningTermsAndKey;
//# sourceMappingURL=modify.js.map