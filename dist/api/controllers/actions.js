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
const res_1 = require("../utils/res");
const path = require("path");
const network = require("../network");
const models_1 = require("../models");
const short = require("short-uuid");
const rsa = require("../crypto/rsa");
const crypto = require("crypto");
const jsonUtils = require("../utils/json");
/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/
const constants = require(path.join(__dirname, '../../config/constants.json'));
exports.getBots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bots = yield models_1.models.Bot.findAll();
        res_1.success(res, {
            bots: bots.map(b => jsonUtils.botToJson(b))
        });
    }
    catch (e) {
        res_1.failure(res, 'no bots');
    }
});
exports.createBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chat_id, name, } = req.body;
    const newBot = {
        id: crypto.randomBytes(8).toString('hex').toUpperCase(),
        chatId: chat_id,
        name: name,
        secret: crypto.randomBytes(16).toString('hex').toUpperCase()
    };
    try {
        const theBot = yield models_1.models.Bot.create(newBot);
        res_1.success(res, jsonUtils.botToJson(theBot));
    }
    catch (e) {
        res_1.failure(res, 'bot creation failed');
    }
});
exports.deleteBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (!id)
        return;
    try {
        models_1.models.Bot.destroy({ where: { id } });
        res_1.success(res, true);
    }
    catch (e) {
        console.log('ERROR deleteBot', e);
        res_1.failure(res, e);
    }
});
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
        if (!(bot.secret && bot.secret === bot_secret)) {
            return res_1.failure(res, 'wrong secret');
        }
        if (!action) {
            return res_1.failure(res, 'no action');
        }
        if (action === 'keysend') {
            console.log('=> BOT KEYSEND');
            if (!(pubkey && pubkey.length === 66 && amount)) {
                return res_1.failure(res, 'wrong params');
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
                return res_1.success(res, { success: true });
            }
            catch (e) {
                return res_1.failure(res, e);
            }
        }
        else if (action === 'broadcast') {
            console.log('=> BOT BROADCAST');
            if (!bot.chatId || !text)
                return res_1.failure(res, 'no uuid or text');
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            const theChat = yield models_1.models.Chat.findOne({ where: { id: bot.chatId } });
            if (!theChat || !owner)
                return res_1.failure(res, 'no chat');
            if (!theChat.type === constants.chat_types.tribe)
                return res_1.failure(res, 'not a tribe');
            const encryptedForMeText = rsa.encrypt(owner.contactKey, text);
            const encryptedText = rsa.encrypt(theChat.groupKey, text);
            const textMap = { 'chat': encryptedText };
            var date = new Date();
            date.setMilliseconds(0);
            const alias = bot.name || 'Bot';
            const msg = {
                chatId: theChat.id,
                uuid: short.generate(),
                type: constants.message_types.message,
                sender: owner.id,
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
            yield network.sendMessage({
                chat: theChat,
                sender: Object.assign(Object.assign({}, owner.dataValues), { alias }),
                message: { content: textMap, id: message.id, uuid: message.uuid },
                type: constants.message_types.message,
                success: () => res_1.success(res, { success: true }),
                failure: () => res_1.failure(res, 'failed'),
            });
        }
        else {
            return res_1.failure(res, 'no action');
        }
    });
}
exports.processAction = processAction;
//# sourceMappingURL=actions.js.map