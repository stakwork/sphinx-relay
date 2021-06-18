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
exports.urlBase64FromHex = exports.testLDAT = exports.urlBase64FromBytes = exports.urlBase64FromAscii = exports.urlBase64 = exports.tokenFromTerms = exports.parseLDAT = exports.startLDAT = void 0;
const zbase32 = require("./zbase32");
const Lightning = require("../grpc/lightning");
const config_1 = require("./config");
const config = config_1.loadConfig();
/*
Lightning Data Access Token
Base64 strings separated by dots:
{host}.{muid}.{buyerPubKey}.{exp}.{metadata}.{signature}

- host: web host for data (ascii->base64)
- muid: ID of media
- buyerPubKey
- exp: unix timestamp expiration (encoded into 4 bytes)
- meta: key/value pairs, url query encoded (alphabetically ordered, ascii->base64)
- signature of all that (concatenated bytes of each)
*/
function tokenFromTerms({ host, muid, ttl, pubkey, meta, ownerPubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        const theHost = host || config.media_host || '';
        const pubkeyBytes = Buffer.from(pubkey, 'hex');
        const pubkey64 = urlBase64FromBytes(pubkeyBytes);
        const now = Math.floor(Date.now() / 1000);
        const exp = ttl ? now + (60 * 60 * 24 * 365) : 0;
        const ldat = startLDAT(theHost, muid, pubkey64, exp, meta);
        if (pubkey != '') {
            const sig = yield Lightning.signBuffer(ldat.bytes, ownerPubkey);
            const sigBytes = zbase32.decode(sig);
            return ldat.terms + "." + urlBase64FromBytes(sigBytes);
        }
        else {
            return ldat.terms;
        }
    });
}
exports.tokenFromTerms = tokenFromTerms;
// host.muid.pk.exp.meta
function startLDAT(host, muid, pk, exp, meta = {}) {
    const empty = Buffer.from([]);
    var hostBuf = Buffer.from(host, 'ascii');
    var muidBuf = Buffer.from(muid, 'base64');
    var pkBuf = pk ? Buffer.from(pk, 'base64') : empty;
    var expBuf = exp ? Buffer.from(exp.toString(16), 'hex') : empty;
    var metaBuf = meta ? Buffer.from(serializeMeta(meta), 'ascii') : empty;
    const totalLength = hostBuf.length + muidBuf.length + pkBuf.length + expBuf.length + metaBuf.length;
    const buf = Buffer.concat([hostBuf, muidBuf, pkBuf, expBuf, metaBuf], totalLength);
    let terms = `${urlBase64(hostBuf)}.${urlBase64(muidBuf)}.${urlBase64(pkBuf)}.${urlBase64(expBuf)}.${urlBase64(metaBuf)}`;
    return { terms, bytes: buf };
}
exports.startLDAT = startLDAT;
const termKeys = [{
        key: 'host',
        func: buf => buf.toString('ascii')
    }, {
        key: 'muid',
        func: buf => urlBase64(buf)
    }, {
        key: 'pubkey',
        func: buf => buf.toString('hex')
    }, {
        key: 'ts',
        func: buf => parseInt('0x' + buf.toString('hex'))
    }, {
        key: 'meta',
        func: buf => {
            const ascii = buf.toString('ascii');
            return ascii ? deserializeMeta(ascii) : {}; // parse this
        }
    }, {
        key: 'sig',
        func: buf => urlBase64(buf)
    }];
function parseLDAT(ldat) {
    const a = ldat.split('.');
    const o = {};
    termKeys.forEach((t, i) => {
        if (a[i])
            o[t.key] = t.func(Buffer.from(a[i], 'base64'));
    });
    return o;
}
exports.parseLDAT = parseLDAT;
function testLDAT() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('testLDAT');
        const terms = {
            host: '',
            ttl: 31536000,
            muid: 'qFSOa50yWeGSG8oelsMvctLYdejPRD090dsypBSx_xg=',
            pubkey: '0373ca36a331d8fd847f190908715a34997b15dc3c5d560ca032cf3412fcf494e4',
            meta: {
                amt: 100,
                ttl: 31536000,
                dim: '1500x1300'
            },
            ownerPubkey: '0373ca36a331d8fd847f190908715a34997b15dc3c5d560ca032cf3412fcf494e4'
        };
        const token = yield tokenFromTerms(terms);
        console.log(token);
        const terms2 = {
            host: '',
            ttl: 0,
            muid: 'qFSOa50yWeGSG8oelsMvctLYdejPRD090dsypBSx_xg=',
            pubkey: '',
            meta: {
                amt: 100,
                ttl: 31536000,
            },
            ownerPubkey: ''
        };
        const token2 = yield tokenFromTerms(terms2);
        console.log(token2);
        console.log(parseLDAT(token2));
    });
}
exports.testLDAT = testLDAT;
function serializeMeta(obj) {
    var str = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    }
    str.sort((a, b) => (a > b ? 1 : -1));
    return str.join("&");
}
function deserializeMeta(str) {
    const json = str && str.length > 2 ? JSON.parse('{"' + str.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) { return key === "" ? value : decodeURIComponent(value); }) : {};
    const ret = {};
    for (let [k, v] of Object.entries(json)) {
        const value = (typeof v === 'string' && parseInt(v)) || v;
        ret[k] = value;
    }
    return ret;
}
function urlBase64(buf) {
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
exports.urlBase64 = urlBase64;
function urlBase64FromBytes(buf) {
    return Buffer.from(buf).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
exports.urlBase64FromBytes = urlBase64FromBytes;
function urlBase64FromAscii(ascii) {
    return Buffer.from(ascii, 'ascii').toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
exports.urlBase64FromAscii = urlBase64FromAscii;
function urlBase64FromHex(ascii) {
    return Buffer.from(ascii, 'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
exports.urlBase64FromHex = urlBase64FromHex;
//# sourceMappingURL=ldat.js.map