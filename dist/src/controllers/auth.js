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
exports.requestExternalTokens = void 0;
const meme = require("../utils/meme");
const res_1 = require("../utils/res");
const tribes = require("../utils/tribes");
function requestExternalTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const pubkey = req.owner.publicKey;
        try {
            const memeToken = yield meme.getMediaToken(pubkey);
            const tribesToken = yield tribes.genSignedTimestamp(pubkey);
            if (!memeToken || !tribesToken) {
                return res_1.failure(res, 'failed to generate token');
            }
            res_1.success(res, {
                memeToken, tribesToken
            });
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.requestExternalTokens = requestExternalTokens;
//# sourceMappingURL=auth.js.map