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
const models_1 = require("../models");
const bots_1 = require("../bots");
const path = require("path");
const node_fetch_1 = require("node-fetch");
const constants = require(path.join(__dirname, '../../config/constants.json'));
/*
default show or not
restrictions (be able to toggle, or dont show chat)
*/
// return bool whether to skip forwarding to tribe
function isBotMsg(msg, sentByMe) {
    return __awaiter(this, void 0, void 0, function* () {
        const txt = msg.message.content;
        const msgType = msg.type;
        if (msgType === constants.message_types.bot_res) {
            return false; // bot res msg type not for processing
        }
        const chat = yield models_1.models.Chat.findOne({ where: {
                uuid: msg.chat.uuid
            } });
        if (!chat)
            return false;
        let didEmit = false;
        if (txt.startsWith('/bot ')) {
            bots_1.builtinBotEmit(msg);
            didEmit = true;
        }
        console.log("DID EMIT", didEmit);
        if (didEmit)
            return didEmit;
        const botsInTribe = yield models_1.models.ChatBot.findAll({ where: {
                chatId: chat.id
            } });
        if (!(botsInTribe && botsInTribe.length))
            return false;
        yield asyncForEach(botsInTribe, (botInTribe) => __awaiter(this, void 0, void 0, function* () {
            if (txt && txt.startsWith(`${botInTribe.botPrefix} `)) {
                if (botInTribe.msgTypes) {
                    try {
                        const msgTypes = JSON.parse(botInTribe.msgTypes);
                        if (msgTypes.includes(msgType)) {
                            didEmit = yield emitMessageToBot(msg, botInTribe.dataValues);
                        }
                    }
                    catch (e) { }
                }
                else { // no message types defined, do all?
                    didEmit = yield emitMessageToBot(msg, botInTribe.dataValues);
                }
            }
        }));
        return didEmit;
    });
}
exports.isBotMsg = isBotMsg;
function emitMessageToBot(msg, botInTribe) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("EMIT MSG TO BOT", msg, botInTribe);
        switch (botInTribe.botType) {
            case constants.bot_types.builtin:
                bots_1.builtinBotEmit(msg);
                return true;
            case constants.bot_types.local:
                return postToBotServer(msg, botInTribe);
            default:
                return false;
        }
    });
}
function postToBotServer(msg, botInTribe) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!botInTribe.webhook || !botInTribe.secret)
            return false;
        const r = yield node_fetch_1.default(botInTribe.webhook, {
            method: 'POST',
            body: JSON.stringify(msg),
            headers: {
                'x-secret': botInTribe.secret
            }
        });
        return r.ok;
    });
}
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=intercept.js.map