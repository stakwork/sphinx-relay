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
exports.downloadAndUploadAndSaveReturningTermsAndKey = exports.sendFinalMemeIfFirstPurchaser = exports.purchaseFromOriginalSender = exports.modifyPayloadAndSaveMediaKey = void 0;
const node_fetch_1 = require("node-fetch");
const ldat_1 = require("../utils/ldat");
const rsa = require("../crypto/rsa");
const crypto = require("crypto");
const meme = require("../utils/meme");
const FormData = require("form-data");
const models_1 = require("../models");
const RNCryptor = require("jscryptor-2");
const send_1 = require("./send");
// import { Op } from 'sequelize'
const constants_1 = require("../constants");
const msgtypes = constants_1.default.message_types;
function modifyPayloadAndSaveMediaKey(payload, chat, sender, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type !== msgtypes.attachment)
            return payload;
        try {
            const ret = yield downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender, owner);
            return fillmsg(payload, ret); // key is re-encrypted later
        }
        catch (e) {
            console.log('[modify] error', e);
            return payload;
        }
    });
}
exports.modifyPayloadAndSaveMediaKey = modifyPayloadAndSaveMediaKey;
// "purchase" type
function purchaseFromOriginalSender(payload, chat, purchaser, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = owner.id;
        if (payload.type !== msgtypes.purchase)
            return;
        const mt = payload.message && payload.message.mediaToken;
        const amount = payload.message.amount;
        const muid = mt && mt.split('.').length && mt.split('.')[1];
        if (!muid)
            return;
        const mediaKey = yield models_1.models.MediaKey.findOne({
            where: { originalMuid: muid, tenant },
        });
        const terms = ldat_1.parseLDAT(mt);
        let price = terms.meta && terms.meta.amt;
        if (amount < price)
            return; // not enough sats
        if (mediaKey) {
            // ALREADY BEEN PURHCASED! simply send
            // send back the new mediaToken and key
            const mediaTerms = {
                muid: mediaKey.muid,
                ttl: 31536000,
                host: '',
                meta: Object.assign({}, (amount && { amt: amount })),
            };
            // send full new key and token
            const msg = {
                mediaTerms,
                mediaKey: mediaKey.key,
                originalMuid: mediaKey.originalMuid,
                mediaType: mediaKey.mediaType,
            };
            send_1.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [purchaser.id] }),
                sender: owner,
                type: constants_1.default.message_types.purchase_accept,
                message: msg,
                success: () => { },
                failure: () => { },
            });
            // PAY THE OG POSTER HERE!!!
            send_1.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [mediaKey.sender] }),
                sender: owner,
                type: constants_1.default.message_types.purchase,
                amount: amount,
                realSatsContactId: mediaKey.sender,
                message: {
                    mediaToken: mt,
                    skipPaymentProcessing: true,
                },
                success: () => { },
                failure: () => { },
            });
        }
        else {
            const ogmsg = yield models_1.models.Message.findOne({
                where: { chatId: chat.id, mediaToken: mt, tenant },
            });
            if (!ogmsg)
                return;
            // purchase it from creator (send "purchase")
            const msg = { mediaToken: mt, purchaser: purchaser.id };
            send_1.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [ogmsg.sender] }),
                sender: Object.assign(Object.assign(Object.assign({}, owner.dataValues), (purchaser && purchaser.alias && { alias: purchaser.alias })), { role: constants_1.default.chat_roles.reader }),
                type: constants_1.default.message_types.purchase,
                realSatsContactId: ogmsg.sender,
                message: msg,
                amount: amount,
                success: () => { },
                failure: () => { },
                isForwarded: true,
            });
        }
    });
}
exports.purchaseFromOriginalSender = purchaseFromOriginalSender;
function sendFinalMemeIfFirstPurchaser(payload, chat, sender, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = owner.id;
        if (payload.type !== msgtypes.purchase_accept)
            return;
        const mt = payload.message && payload.message.mediaToken;
        const typ = payload.message && payload.message.mediaType;
        const purchaserID = payload.message && payload.message.purchaser;
        if (!mt)
            return;
        const muid = mt && mt.split('.').length && mt.split('.')[1];
        if (!muid)
            return;
        const existingMediaKey = yield models_1.models.MediaKey.findOne({
            where: { muid, tenant },
        });
        if (existingMediaKey)
            return; // no need, its already been sent
        // const host = mt.split('.')[0]
        const terms = ldat_1.parseLDAT(mt);
        const ogPurchaser = yield models_1.models.Contact.findOne({
            where: {
                id: purchaserID,
                tenant,
            },
        });
        if (!ogPurchaser)
            return;
        const amt = (terms.meta && terms.meta.amt) || 0;
        // const ogPurchaseMessage = await models.Message.findOne({where:{
        //   mediaToken: {[Op.like]: `${host}.${muid}%`},
        //   type: msgtypes.purchase,
        // }})
        const termsAndKey = yield downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender, owner, amt);
        // send it to the purchaser
        send_1.sendMessage({
            sender: Object.assign(Object.assign(Object.assign({}, owner.dataValues), (sender && sender.alias && { alias: sender.alias })), { role: constants_1.default.chat_roles.reader }),
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [ogPurchaser.id] }),
            type: msgtypes.purchase_accept,
            message: Object.assign(Object.assign({}, termsAndKey), { mediaType: typ, originalMuid: muid }),
            success: () => { },
            receive: () => { },
            isForwarded: true,
        });
    });
}
exports.sendFinalMemeIfFirstPurchaser = sendFinalMemeIfFirstPurchaser;
function fillmsg(full, props) {
    return Object.assign(Object.assign({}, full), { message: Object.assign(Object.assign({}, full.message), props) });
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
function downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender, owner, injectedAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const mt = payload.message && payload.message.mediaToken;
        const key = payload.message && payload.message.mediaKey;
        const typ = payload.message && payload.message.mediaType;
        if (!mt || !key)
            return payload; // save anyway??????????
        // console.log('[modify] ==> downloadAndUploadAndSaveReturningTermsAndKey', owner)
        const tenant = owner.id;
        const ownerPubkey = owner.publicKey;
        const ogmuid = mt && mt.split('.').length && mt.split('.')[1];
        const terms = ldat_1.parseLDAT(mt);
        if (!terms.host)
            return payload;
        const token = yield meme.lazyToken(ownerPubkey, terms.host);
        // console.log('[modify] meme token', token)
        // console.log('[modify] terms.host', terms.host)
        // console.log('[modify] mt', mt)
        try {
            let protocol = 'https';
            if (terms.host.includes('localhost'))
                protocol = 'http';
            const r = yield node_fetch_1.default(`${protocol}://${terms.host}/file/${mt}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // console.log("[modify] dl RES", r)
            const buf = yield r.buffer();
            const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key);
            // console.log('[modify] about to decrypt', buf.length, decMediaKey)
            const imgBuf = RNCryptor.Decrypt(buf.toString('base64'), decMediaKey);
            const newKey = crypto.randomBytes(20).toString('hex');
            // console.log('[modify] about to encrypt', imgBuf.length, newKey)
            const encImgBase64 = RNCryptor.Encrypt(imgBuf, newKey);
            var encImgBuffer = Buffer.from(encImgBase64, 'base64');
            const form = new FormData();
            form.append('file', encImgBuffer, {
                contentType: typ || 'image/jpg',
                filename: 'Image.jpg',
                knownLength: encImgBuffer.length,
            });
            const formHeaders = form.getHeaders();
            const resp = yield node_fetch_1.default(`${protocol}://${terms.host}/file`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, formHeaders), { Authorization: `Bearer ${token}` }),
                body: form,
            });
            let json = yield resp.json();
            if (!json.muid)
                throw new Error('no muid');
            // PUT NEW TERMS, to finish in personalizeMessage
            const amt = (terms.meta && terms.meta.amt) || injectedAmount;
            const ttl = terms.meta && terms.meta.ttl;
            const mediaTerms = {
                muid: json.muid,
                ttl: ttl || 31536000,
                host: '',
                meta: Object.assign({}, (amt && { amt })),
            };
            const encKey = rsa.encrypt(chat.groupKey, newKey.slice());
            var date = new Date();
            date.setMilliseconds(0);
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
                mediaType: typ,
                tenant,
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