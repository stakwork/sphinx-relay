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
exports.requestTransportKey = exports.requestExternalTokens = exports.verifyAuthRequest = void 0;
const jwt_1 = require("../utils/jwt");
const res_1 = require("../utils/res");
const config_1 = require("../utils/config");
const tribes = require("../utils/tribes");
const cert_1 = require("../utils/cert");
const fs = require("fs");
const config = config_1.loadConfig();
function verifyAuthRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        try {
            const sc = [jwt_1.scopes.PERSONAL, jwt_1.scopes.BOTS];
            const jot = jwt_1.createJWT(req.owner.publicKey, sc, 10080); // one week
            const bod = {
                pubkey: req.owner.publicKey,
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                price_to_meet: req.owner.priceToMeet,
                jwt: jot,
            };
            const token = yield tribes.genSignedTimestamp(req.owner.publicKey);
            res_1.success(res, {
                info: bod,
                token,
            });
            // const protocol = j.host.includes("localhost") ? "http" : "https";
            // await fetch(`${protocol}://${j.host}/verify/${j.challenge}?token=${token}`, {
            //   method: "POST",
            //   body: JSON.stringify(bod),
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            // });
            // success(res, 'ok')
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.verifyAuthRequest = verifyAuthRequest;
function requestExternalTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        try {
            const result = {
                pubkey: req.owner.publicKey,
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                price_to_meet: req.owner.priceToMeet,
                jwt: '',
            };
            res_1.success(res, result);
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.requestExternalTokens = requestExternalTokens;
function requestTransportKey(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let transportPublicKey = null;
        try {
            transportPublicKey = fs.readFileSync(config.transportPublicKeyLocation, 'utf8');
        }
        catch (e) {
            //We want to do nothing here
        }
        if (transportPublicKey != null) {
            res_1.success(res, { transport_key: transportPublicKey });
            return;
        }
        const transportTokenKeys = yield cert_1.generateTransportTokenKeys();
        res_1.success(res, { transport_key: transportTokenKeys });
    });
}
exports.requestTransportKey = requestTransportKey;
//# sourceMappingURL=auth.js.map