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
const rncryptor_1 = require("../utils/rncryptor");
const fetch = require("node-fetch");
const ldat_1 = require("../utils/ldat");
const rsa = require("../crypto/rsa");
const crypto = require("crypto");
const Blob = require("fetch-blob");
const constants = require(path.join(__dirname, '../../config/constants.json'));
const msgtypes = constants.message_types;
function modifyPayload(payload, chat) {
    return __awaiter(this, void 0, void 0, function* () {
        if (payload.type === msgtypes.attachment) {
            console.log("MODIFY, ", payload);
            const mt = payload.message && payload.message.mediaToken;
            const key = payload.message && payload.message.mediaKey;
            const typ = payload.message && payload.message.mediaType;
            if (!mt || !key)
                return payload;
            const terms = ldat_1.parseLDAT(mt);
            if (!terms.host)
                return payload;
            try {
                const r = yield fetch(`https://${terms.host}/file/${mt}`);
                const buf = yield r.buffer();
                const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key);
                const imgBase64 = rncryptor_1.default.Decrypt(decMediaKey, buf.toString('base64'));
                const newKey = crypto.randomBytes(20).toString('hex');
                const encImg = rncryptor_1.default.Encrypt(newKey, imgBase64);
                const resp = yield fetch(`https://${terms.host}/file`, {
                    method: 'POST',
                    body: new Blob([encImg], { type: typ || 'image/jpg', name: 'file', filename: 'Image.jpg' })
                });
                let json = resp.json();
                if (!json.muid)
                    return payload;
                // PUT NEW TERMS, to finish in personalizeMessage
                const amt = terms.meta && terms.meta.amt;
                const ttl = terms.meta && terms.meta.ttl;
                const mediaTerms = {
                    muid: json.muid, ttl: ttl || 31536000,
                    meta: Object.assign({}, amt && { amt }),
                    skipSigning: amt ? true : false // only sign if its free
                };
                const encKey = rsa.encrypt(chat.groupKey, newKey);
                return fillmsg(payload, { mediaTerms, mediaKey: encKey }); // key is re-encrypted later
            }
            catch (e) {
                return payload;
            }
            // how to link w og msg? ogMediaToken?
        }
        return payload;
    });
}
exports.modifyPayload = modifyPayload;
function fillmsg(full, props) {
    return Object.assign(Object.assign({}, full), { message: Object.assign(Object.assign({}, full.message), props) });
}
//# sourceMappingURL=modify.js.map