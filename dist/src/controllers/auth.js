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
const rsa = require("../crypto/rsa");
const tribes = require("../utils/tribes");
const fs = require("fs");
const config = (0, config_1.loadConfig)();
function verifyAuthRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        try {
            const sc = [jwt_1.scopes.PERSONAL, jwt_1.scopes.BOTS];
            const jot = (0, jwt_1.createJWT)(req.owner.publicKey, sc, 10080); // one week
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
            (0, res_1.success)(res, {
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
            (0, res_1.failure)(res, e);
        }
    });
}
exports.verifyAuthRequest = verifyAuthRequest;
function requestExternalTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
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
            (0, res_1.success)(res, result);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
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
        catch (e) { }
        if (transportPublicKey != null) {
            (0, res_1.success)(res, { transport_key: transportPublicKey });
            return;
        }
        const transportTokenKeys = yield rsa.genKeys();
        fs.writeFileSync(config.transportPublicKeyLocation, transportTokenKeys.public);
        fs.writeFileSync(config.transportPrivateKeyLocation, transportTokenKeys.private);
        (0, res_1.success)(res, { transport_key: transportTokenKeys.public });
    });
}
exports.requestTransportKey = requestTransportKey;
//# sourceMappingURL=auth.js.map