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
exports.requestExternalTokens = exports.verifyAuthRequest = void 0;
const jwt_1 = require("../utils/jwt");
const res_1 = require("../utils/res");
const tribes = require("../utils/tribes");
function verifyAuthRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        try {
            const sc = [jwt_1.scopes.PERSONAL];
            const jot = jwt_1.createJWT(req.owner.publicKey, sc);
            const bod = {
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                jwt: jot,
            };
            const token = yield tribes.genSignedTimestamp(req.owner.publicKey);
            res_1.success(res, {
                info: bod,
                token
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
            return res_1.failure(res, "no owner");
        try {
            const result = {
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                jwt: ''
            };
            res_1.success(res, result);
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.requestExternalTokens = requestExternalTokens;
//# sourceMappingURL=auth.js.map