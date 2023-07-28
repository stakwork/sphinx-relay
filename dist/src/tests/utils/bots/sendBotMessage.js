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
exports.sendBotMessage = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function sendBotMessage(t, node1, bot, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const v = {
            action: 'broadcast',
            bot_id: bot.id,
            bot_secret: bot.secret,
            chat_uuid: tribe.uuid,
            content: 'Testing external api based bot',
        };
        try {
            const r = yield http.post(node1.external_ip + '/action', (0, helpers_1.makeArgs)(node1, v));
            t.true(r.success, 'Send bot message.');
            return r;
        }
        catch (error) {
            return error.error;
        }
    });
}
exports.sendBotMessage = sendBotMessage;
//# sourceMappingURL=sendBotMessage.js.map