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
const tribes = require("../utils/tribes");
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
        const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid } = body;
        if (!bot_id)
            return res_1.failure(res, 'no bot_id');
        const bot = yield models_1.models.Bot.findOne({ where: { id: bot_id } });
        if (!bot)
            return res_1.failure(res, 'no bot');
        if (!(bot.secret && bot.secret === bot_secret)) {
            return res_1.failure(res, 'wrong secret');
        }
        if (!action) {
            return res_1.failure(res, 'no action');
        }
        const a = {
            action, pubkey, content, amount,
            bot_name: bot.name, chat_uuid,
            bot_id
        };
        try {
            const r = yield finalAction(a, bot_id);
            res_1.success(res, r);
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.processAction = processAction;
function finalAction(a, bot_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { action, pubkey, amount, content, bot_name, chat_uuid } = a;
        if (!chat_uuid)
            throw 'no chat_uuid';
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        let theChat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        const iAmTribeAdmin = owner.publicKey === (theChat && theChat.ownerPubkey);
        console.log("=> ACTION HIT", a);
        if (!iAmTribeAdmin) { // IM NOT ADMIN - its my bot and i need to forward to admin
            const myBot = yield models_1.models.Bot.findOne({ where: {
                    id: bot_id
                } });
            if (!myBot)
                return console.log('no bot');
            // THIS is a bot member cmd res (i am bot maker)
            const botMember = yield models_1.models.BotMember.findOne({ where: {
                    tribeUuid: chat_uuid, botId: bot_id
                } });
            if (!botMember)
                return console.log('no botMember');
            const dest = botMember.memberPubkey;
            if (!dest)
                return console.log('no dest to send to');
            const topic = `${dest}/${myBot.uuid}`;
            const data = {
                message: a,
                bot_id,
                sender: { pub_key: owner.publicKey },
            };
            yield tribes.publish(topic, data, function () {
                console.log('=> bbot res forwarded back to tribe admin');
            });
            return;
        }
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
            if (!content)
                throw 'no content';
            if (!theChat)
                throw 'no chat';
            if (!theChat.type === constants.chat_types.tribe)
                throw 'not a tribe';
            const encryptedForMeText = rsa.encrypt(owner.contactKey, content);
            const encryptedText = rsa.encrypt(theChat.groupKey, content);
            const textMap = { 'chat': encryptedText };
            var date = new Date();
            date.setMilliseconds(0);
            const alias = bot_name || 'Bot';
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