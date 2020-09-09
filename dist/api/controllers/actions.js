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
const path = require("path");
const network = require("../network");
const models_1 = require("../models");
const short = require("short-uuid");
const rsa = require("../crypto/rsa");
const jsonUtils = require("../utils/json");
const socket = require("../utils/socket");
const res_1 = require("../utils/res");
/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/
const constants = require(path.join(__dirname, '../../config/constants.json'));
function processAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let body = req.body;
        if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
            try { // parse out body from "data" for github webhook action
                const dataBody = JSON.parse(body.data.replace(/'/g, '"'));
                if (dataBody)
                    body = dataBody;
            }
            catch (e) {
                console.log(e);
                return res_1.failure(res, 'failed to parse webhook body json');
            }
        }
        const { action, bot_id, bot_secret, pubkey, amount, text } = body;
        const bot = yield models_1.models.Bot.findOne({ where: { id: bot_id } });
        if (!bot)
            return res_1.failure(res, 'no bot');
        const chat = yield models_1.models.Chat.findOne({ where: { id: bot.chatId } });
        if (!(bot.secret && bot.secret === bot_secret)) {
            return res_1.failure(res, 'wrong secret');
        }
        if (!action) {
            return res_1.failure(res, 'no action');
        }
        const a = {
            action, pubkey, content: text, amount,
            botName: bot.name, chatUUID: chat.uuid
        };
        try {
            const r = yield finalAction(a);
            res_1.success(res, r);
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.processAction = processAction;
function finalAction(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { action, pubkey, amount, content, botName, chatUUID } = a;
        if (action === 'keysend') {
            console.log('=> BOT KEYSEND');
            if (!(pubkey && pubkey.length === 66 && amount)) {
                throw 'wrong params';
            }
            const MIN_SATS = 3;
            const destkey = pubkey;
            const opts = {
                dest: destkey,
                data: {},
                amt: Math.max((amount || 0), MIN_SATS)
            };
            try {
                yield network.signAndSend(opts);
                return ({ success: true });
            }
            catch (e) {
                throw e;
            }
        }
        else if (action === 'broadcast') {
            console.log('=> BOT BROADCAST');
            if (!chatUUID || !content)
                throw 'no chatID or content';
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            const theChat = yield models_1.models.Chat.findOne({ where: { uuid: chatUUID } });
            if (!theChat || !owner)
                throw 'no chat';
            if (!theChat.type === constants.chat_types.tribe)
                throw 'not a tribe';
            const encryptedForMeText = rsa.encrypt(owner.contactKey, content);
            const encryptedText = rsa.encrypt(theChat.groupKey, content);
            const textMap = { 'chat': encryptedText };
            var date = new Date();
            date.setMilliseconds(0);
            const alias = botName || 'Bot';
            const botContactId = -1;
            const msg = {
                chatId: theChat.id,
                uuid: short.generate(),
                type: constants.message_types.bot_res,
                sender: botContactId,
                amount: amount || 0,
                date: date,
                messageContent: encryptedForMeText,
                remoteMessageContent: JSON.stringify(textMap),
                status: constants.statuses.confirmed,
                createdAt: date,
                updatedAt: date,
                senderAlias: alias,
            };
            const message = yield models_1.models.Message.create(msg);
            socket.sendJson({
                type: 'message',
                response: jsonUtils.messageToJson(message, theChat, owner)
            });
            yield network.sendMessage({
                chat: theChat,
                sender: Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId }),
                message: { content: textMap, id: message.id, uuid: message.uuid },
                type: constants.message_types.bot_res,
                success: () => ({ success: true }),
                failure: (e) => {
                    throw e;
                }
            });
        }
        else {
            throw 'no action';
        }
    });
}
exports.finalAction = finalAction;
//# sourceMappingURL=actions.js.map