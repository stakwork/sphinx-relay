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
exports.getCheckBotMsg = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getCheckBotMsg(t, node, botAlias, tribe, count) {
    return new Promise((resolve, reject) => {
        let i = 0;
        const interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            i++;
            const msgRes = yield http.get(node.external_ip + '/messages', (0, helpers_1.makeArgs)(node));
            if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
                const messages = msgRes.response.new_messages;
                let msgCount = 0;
                for (let i = 0; i < messages.length; i++) {
                    let msg = messages[i];
                    if (msg.chat.uuid === tribe.uuid && msg.sender_alias === botAlias) {
                        msgCount += 1;
                        if (msgCount === count) {
                            clearInterval(interval);
                            resolve(msg);
                        }
                    }
                }
            }
            if (i > 10) {
                clearInterval(interval);
                reject(['failed to getCheckBotMsgs']);
            }
        }), 1000);
    });
}
exports.getCheckBotMsg = getCheckBotMsg;
//# sourceMappingURL=getCheckBotMsg.js.map