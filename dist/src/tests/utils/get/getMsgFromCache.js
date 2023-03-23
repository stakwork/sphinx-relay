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
exports.getCacheMsg = void 0;
const http = require("ava-http");
const config_1 = require("../../config");
function getCacheMsg(t, tribe, message, content) {
    return __awaiter(this, void 0, void 0, function* () {
        if (config_1.config.cache) {
            const msgRes = yield http.get(`http://localhost:8008/api/msgs/${tribe.uuid}`);
            if (msgRes.length > 0) {
                for (let i = 0; i < msgRes.length; i++) {
                    const msg = msgRes[i];
                    if (msg.uuid === message.uuid && msg.message_content === content) {
                        return true;
                    }
                }
                return false;
            }
            else {
                return false;
            }
        }
        return true;
    });
}
exports.getCacheMsg = getCacheMsg;
//# sourceMappingURL=getMsgFromCache.js.map