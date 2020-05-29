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
// import { models } from '../models'
const RNCryptor = require("jscryptor");
const constants = require(path.join(__dirname, '../../config/constants.json'));
const msgtypes = constants.message_types;
function modifyPayloadAndSaveMediaKey(payload, chat, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type === msgtypes.attachment) {
            const mt = payload.message && payload.message.mediaToken;
            const key = payload.message && payload.message.mediaKey;
            const typ = payload.message && payload.message.mediaType;
            if (!mt || !key)
                return payload;
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
                const encImgBuffer = RNCryptor.Encrypt(imgBuf, newKey);
                console.log('encImgBuffer.length', encImgBuffer.length, typeof encImgBuffer);
                // var encImgBuffer = Buffer.from(encImg,'base64');
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
                console.log('json.muid', json.muid);
                if (!json.muid)
                    return payload;
                // PUT NEW TERMS, to finish in personalizeMessage
                const amt = terms.meta && terms.meta.amt;
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
                // await sleep(1)
                // await models.MediaKey.create({
                //   muid:json.muid,
                //   chatId:chat.id,
                //   key:encKey,
                //   messageId: (payload.message&&payload.message.id)||0,
                //   receiver: 0,
                //   sender: sender.id, // the og sender
                //   createdAt: date,
                // })
                console.log('{mediaTerms,mediaKey:encKey}', { mediaTerms, mediaKey: encKey });
                return fillmsg(payload, { mediaTerms, mediaKey: encKey }); // key is re-encrypted later
            }
            catch (e) {
                console.log("[modify] error", e);
                return payload;
            }
            // how to link w og msg? ogMediaToken?
        }
        else {
            return payload;
        }
    });
}
exports.modifyPayloadAndSaveMediaKey = modifyPayloadAndSaveMediaKey;
function fillmsg(full, props) {
    return Object.assign(Object.assign({}, full), { message: Object.assign(Object.assign({}, full.message), props) });
}
// async function sleep(ms) {
// 	return new Promise(resolve => setTimeout(resolve, ms))
// }
//# sourceMappingURL=modify.js.map