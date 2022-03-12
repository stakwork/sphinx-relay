"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyHmac = exports.sign = exports.ALGO = void 0;
const crypto = require("crypto");
exports.ALGO = 'sha256';
// rawBody: utf8 string
// secret: hex encoded
function sign(rawBody, secret) {
    if (!rawBody || !secret) {
        throw new Error('hmac missing data');
    }
    const hmac = crypto.createHmac(exports.ALGO, secret);
    return Buffer.from(exports.ALGO + '=' + hmac.update(Buffer.from(rawBody)).digest('hex'), 'utf8');
}
exports.sign = sign;
function verifyHmac(signature, rawBody, secret) {
    if (!rawBody || !secret) {
        return false;
    }
    try {
        const sig = Buffer.from(signature || '', 'utf8');
        const digest = sign(rawBody, secret);
        if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
            return false;
        }
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.verifyHmac = verifyHmac;
//# sourceMappingURL=hmac.js.map