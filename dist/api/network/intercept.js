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
// const defaultPrefixes = [
//   '/bot', '/welcome'
// ]
// return bool whether to skip forwarding to tribe
function isBotMsg(msg, sentByMe) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("==> is bot msg???");
        const txt = msg.message.content;
        const chat = yield models_1.models.Chat.findOne({ where: {
                uuid: msg.chat.uuid
            } });
        if (!chat)
            return false;
        console.log("==> is bot msg txt", txt);
        if (txt.startsWith('/bot ')) {
            const ok = bots_1.processBotMessage(msg, chat, null);
            return ok ? true : false;
        }
        const botsInTribe = yield models_1.models.ChatMember.findAll({ where: {
                bot: true, chatId: chat.id
            } });
        if (!(botsInTribe && botsInTribe.length))
            return false;
        let ok = false;
        yield asyncForEach(botsInTribe, (botInTribe) => __awaiter(this, void 0, void 0, function* () {
            if (txt.startsWith(`${botInTribe.botPrefix} `)) {
                ok = yield bots_1.processBotMessage(msg, chat, botInTribe);
            }
        }));
        return ok;
    });
}
exports.isBotMsg = isBotMsg;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=intercept.js.map