"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function encrypt(key, txt) {
    try {
        const pubc = cert.pub(key);
        const buf = crypto.publicEncrypt({
            key: pubc,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(txt, 'utf-8'));
        return buf.toString('base64');
    }
    catch (e) {
        return '';
    }
}
exports.encrypt = encrypt;
function decrypt(privateKey, enc) {
    try {
        const privc = cert.priv(privateKey);
        const buf = crypto.privateDecrypt({
            key: privc,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(enc, 'base64'));
        return buf.toString('utf-8');
    }
    catch (e) {
        return '';
    }
}
exports.decrypt = decrypt;
function testRSA() {
    crypto.generateKeyPair('rsa', {
        modulusLength: 2048
    }, (err, publicKey, priv) => {
        const pubPEM = publicKey.export({
            type: 'pkcs1', format: 'pem'
        });
        const pub = cert.unpub(pubPEM);
        const msg = 'hi';
        const enc = encrypt(pub, msg);
        const dec = decrypt(priv, enc);
        console.log("FINAL:", dec);
    });
}
exports.testRSA = testRSA;
const cert = {
    unpub: function (key) {
        let s = key;
        s = s.replace('-----BEGIN RSA PUBLIC KEY-----', '');
        s = s.replace('-----END RSA PUBLIC KEY-----', '');
        return s.replace(/[\r\n]+/gm, '');
    },
    pub: function (key) {
        return '-----BEGIN RSA PUBLIC KEY-----\n' +
            key + '\n' +
            '-----END RSA PUBLIC KEY-----';
    },
    priv: function (key) {
        return '-----BEGIN RSA PRIVATE KEY-----\n' +
            key + '\n' +
            '-----END RSA PRIVATE KEY-----';
    }
};
//# sourceMappingURL=rsa.js.map