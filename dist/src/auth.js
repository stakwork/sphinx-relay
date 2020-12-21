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
const crypto = require("crypto");
const models_1 = require("./models");
const cryptoJS = require("crypto-js");
const res_1 = require("./utils/res");
const macaroon_1 = require("./utils/macaroon");
const config_1 = require("./utils/config");
const fs = require('fs');
const config = config_1.loadConfig();
/*
"unlock": true,
"encrypted_macaroon_path": "/relay/.lnd/admin.macaroon.enc"
*/
function unlocker(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { password } = req.body;
        if (!password) {
            res_1.failure(res, 'no password');
            return false;
        }
        const encMacPath = config.encrypted_macaroon_path;
        if (!encMacPath) {
            res_1.failure(res, 'no macaroon path');
            return false;
        }
        let hexMac;
        try {
            var encMac = fs.readFileSync(config.encrypted_macaroon_path, "utf8");
            if (!encMac) {
                res_1.failure(res, 'no macaroon');
                return false;
            }
            const decMac = decryptMacaroon(password, encMac);
            if (!decMac) {
                res_1.failure(res, 'failed to decrypt macaroon');
                return false;
            }
            hexMac = base64ToHex(decMac);
        }
        catch (e) {
            res_1.failure(res, e);
            return false;
        }
        if (hexMac) {
            macaroon_1.setInMemoryMacaroon(hexMac);
            res_1.success(res, 'success!');
            yield sleep(100);
            return true;
        }
        else {
            res_1.failure(res, 'failed to set macaroon in memory');
            return false;
        }
    });
}
exports.unlocker = unlocker;
function authModule(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.path == '/app' ||
            req.path == '/' ||
            req.path == '/unlock' ||
            req.path == '/info' ||
            req.path == '/action' ||
            req.path == '/contacts/tokens' ||
            req.path == '/latest' ||
            req.path.startsWith('/static') ||
            req.path == '/contacts/set_dev' ||
            req.path == '/connect' ||
            req.path == '/utxos') {
            next();
            return;
        }
        if (process.env.HOSTING_PROVIDER === 'true') {
            // const domain = process.env.INVITE_SERVER
            const host = req.headers.origin;
            console.log('=> host:', host);
            const referer = req.headers.referer;
            console.log('=> referer:', referer);
            if (req.path === '/invoices') {
                next();
                return;
            }
        }
        const token = req.headers['x-user-token'] || req.cookies['x-user-token'];
        if (token == null) {
            res.writeHead(401, 'Access invalid for user', { 'Content-Type': 'text/plain' });
            res.end('Invalid credentials');
        }
        else {
            const user = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
            if (user.authToken == null || user.authToken != hashedToken) {
                res.writeHead(401, 'Access invalid for user', { 'Content-Type': 'text/plain' });
                res.end('Invalid credentials');
            }
            else {
                next();
            }
        }
    });
}
exports.authModule = authModule;
function decryptMacaroon(password, macaroon) {
    try {
        const decrypted = cryptoJS.AES.decrypt(macaroon || '', password).toString(cryptoJS.enc.Base64);
        const decryptResult = atob(decrypted);
        return decryptResult;
    }
    catch (e) {
        console.error('cipher mismatch, macaroon decryption failed');
        console.error(e);
        return '';
    }
}
function base64ToHex(str) {
    const raw = atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += (hex.length === 2 ? hex : '0' + hex);
    }
    return result.toUpperCase();
}
exports.base64ToHex = base64ToHex;
const atob = a => Buffer.from(a, 'base64').toString('binary');
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
//# sourceMappingURL=auth.js.map