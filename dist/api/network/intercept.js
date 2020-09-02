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
const bots_1 = require("../controllers/bots");
const models_1 = require("../models");
function isBotMsg(msg, sentByMe) {
    return __awaiter(this, void 0, void 0, function* () {
        const txt = msg.message.content;
        const chat = yield models_1.models.Chat.findOne({ where: {
                uuid: msg.chat.uuid
            } });
        if (!chat)
            return false;
        if (txt.startsWith('/bot ')) {
            const ok = bots_1.processBotMessage(msg, chat, null);
            return ok ? true : false;
        }
        const botInTribe = yield models_1.models.ChatMember.findOne({ where: {
                bot: true, chatId: chat.id
            } });
        if (!botInTribe)
            return false;
        if (!(botInTribe.botMakerPubkey && botInTribe.botUuid))
            return false;
        if (txt.startsWith(`${botInTribe.botPrefix} `)) {
            const ok = yield bots_1.processBotMessage(msg, chat, botInTribe);
            return ok ? true : false;
        }
        return false;
        // check if bot msg
        // check my ChatMembers to see if its here
        // process it "bot_cmd"
    });
}
exports.isBotMsg = isBotMsg;
//# sourceMappingURL=intercept.js.map