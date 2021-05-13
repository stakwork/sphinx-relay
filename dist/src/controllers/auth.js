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
const jwt = require("../utils/jwt");
const res_1 = require("../utils/res");
const tribes = require("../utils/tribes");
function verifyAuthRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const j = req.body;
        if (!j.host || !j.challenge)
            return res_1.failure(res, 'nope1');
        try {
            const jot = jwt.createJWT(req.owner.publicKey);
            const bod = {
                alias: req.owner.alias,
                photoUrl: req.owner.photoUrl,
                routeHint: req.owner.routeHint,
                contactKey: req.owner.contactKey,
                jwt: jot,
            };
            const token = yield tribes.genSignedTimestamp(req.owner.publicKey);
            const protocol = j.host.includes("localhost") ? "http" : "https";
            yield fetch(`${protocol}://${j.host}/verify/${j.challenge}?token=${token}`, {
                method: "POST",
                body: JSON.stringify(bod),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            res_1.success(res, 'ok');
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
                photoUrl: req.owner.photoUrl,
                routeHint: req.owner.routeHint,
                contactKey: req.owner.contactKey,
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