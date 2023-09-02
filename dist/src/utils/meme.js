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
exports.getMediaToken = exports.lazyToken = void 0;
const moment = require("moment");
const rp = require("request-promise");
const ldat_1 = require("../utils/ldat");
const zbase32 = require("../utils/zbase32");
const helpers = require("../helpers");
const config_1 = require("../utils/config");
const Lightning = require("../grpc/lightning");
const logger_1 = require("./logger");
const config = (0, config_1.loadConfig)();
// {pubkey: {host: {token,ts} }}
const tokens = {};
function lazyToken(pubkey, host) {
    return __awaiter(this, void 0, void 0, function* () {
        if (tokens[pubkey] && tokens[pubkey][host]) {
            const ts = tokens[pubkey][host].ts;
            const now = moment().unix();
            if (ts > now - 604700) {
                // in the last week
                return tokens[pubkey][host].token;
            }
        }
        try {
            const t = yield getMediaToken(pubkey, host);
            if (!tokens[pubkey])
                tokens[pubkey] = {};
            tokens[pubkey][host] = {
                token: t,
                ts: moment().unix(),
            };
            return t;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`error getting token ${e}`, logger_1.logging.Meme);
        }
    });
}
exports.lazyToken = lazyToken;
let mediaProtocol = 'https';
if (config.media_host.includes('localhost'))
    mediaProtocol = 'http';
if (config.media_host.includes('meme.sphinx:5555'))
    mediaProtocol = 'http';
const mediaURL = mediaProtocol + '://' + config.media_host + '/';
function getMediaToken(ownerPubkey, host) {
    return __awaiter(this, void 0, void 0, function* () {
        let protocol = 'https';
        if (host === null || host === void 0 ? void 0 : host.includes('localhost'))
            protocol = 'http';
        if (host === null || host === void 0 ? void 0 : host.includes('meme.sphinx:5555'))
            protocol = 'http';
        const theURL = host ? `${protocol}://${host}/` : mediaURL;
        yield helpers.sleep(300);
        try {
            const res = yield rp.get(theURL + 'ask');
            const r = JSON.parse(res);
            if (!(r && r.challenge && r.id)) {
                throw new Error('no challenge');
            }
            const sig = yield Lightning.signBuffer(Buffer.from(r.challenge, 'base64'), ownerPubkey);
            if (!sig)
                throw new Error('no signature');
            const pubkey = ownerPubkey;
            const sigBytes = zbase32.decode(sig);
            const sigBase64 = (0, ldat_1.urlBase64FromBytes)(sigBytes);
            logger_1.sphinxLogger.info(`verify ${pubkey}`, logger_1.logging.Meme);
            const bod = yield rp.post(theURL + 'verify', {
                form: { id: r.id, sig: sigBase64, pubkey },
            });
            const body = JSON.parse(bod);
            if (!(body && body.token)) {
                throw new Error('no token');
            }
            return body.token;
        }
        catch (e) {
            logger_1.sphinxLogger.warning('get media token failed', logger_1.logging.Meme);
            throw e;
        }
    });
}
exports.getMediaToken = getMediaToken;
//# sourceMappingURL=meme.js.map