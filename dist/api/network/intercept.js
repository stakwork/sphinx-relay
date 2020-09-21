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
const builtin_1 = require("../builtin");
const bots_1 = require("../controllers/bots");
const path = require("path");
const SphinxBot = require("sphinx-bot");
const constants = require(path.join(__dirname, '../../config/constants.json'));
/*
default show or not
restrictions (be able to toggle, or dont show chat)
*/
// return bool whether to skip forwarding to tribe
function isBotMsg(msg, sentByMe) {
    return __awaiter(this, void 0, void 0, function* () {
        const txt = msg.message && msg.message.content;
        if (!txt)
            return false;
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
            builtin_1.builtinBotEmit(msg);
            didEmit = true;
        }
        if (didEmit)
            return didEmit;
        const botsInTribe = yield models_1.models.ChatBot.findAll({ where: {
                chatId: chat.id
            } });
        console.log('=> botsInTribe', botsInTribe);
        if (!(botsInTribe && botsInTribe.length))
            return false;
        yield asyncForEach(botsInTribe, (botInTribe) => __awaiter(this, void 0, void 0, function* () {
            if (botInTribe.msgTypes) {
                console.log('=> botInTribe.msgTypes', botInTribe);
                try {
                    const msgTypes = JSON.parse(botInTribe.msgTypes);
                    if (msgTypes.includes(msgType)) {
                        const isMsgAndHasText = msgType === constants.message_types.message && txt && txt.startsWith(`${botInTribe.botPrefix} `);
                        const isNotMsg = msgType !== constants.message_types.message;
                        if (isMsgAndHasText || isNotMsg) {
                            didEmit = yield emitMessageToBot(msg, botInTribe.dataValues);
                        }
                    }
                }
                catch (e) { }
            }
            else { // no message types defined, do all?
                if (txt && txt.startsWith(`${botInTribe.botPrefix} `)) {
                    console.log('=> botInTribe.msgTypes else', botInTribe.dataValues);
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
        console.log('emitMessageToBot', msg);
        switch (botInTribe.botType) {
            case constants.bot_types.builtin:
                builtin_1.builtinBotEmit(msg);
                return true;
            case constants.bot_types.local:
                const bot = yield models_1.models.Bot.findOne({ where: {
                        uuid: botInTribe.botUuid
                    } });
                return bots_1.postToBotServer(msg, bot, SphinxBot.MSG_TYPE.MESSAGE);
            case constants.bot_types.remote:
                return bots_1.keysendBotCmd(msg, botInTribe);
            default:
                return false;
        }
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