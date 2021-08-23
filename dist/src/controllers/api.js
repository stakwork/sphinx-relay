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
exports.finalAction = exports.processAction = void 0;
const network = require("../network");
const models_1 = require("../models");
const short = require("short-uuid");
const rsa = require("../crypto/rsa");
const jsonUtils = require("../utils/json");
const socket = require("../utils/socket");
const res_1 = require("../utils/res");
const constants_1 = require("../constants");
const tribes_1 = require("../utils/tribes");
function processAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> processAction', req.body);
        let body = req.body;
        if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
            try {
                // parse out body from "data" for github webhook action
                const dataBody = JSON.parse(body.data.replace(/'/g, '"'));
                if (dataBody)
                    body = dataBody;
            }
            catch (e) {
                console.log(e);
                return res_1.failure(res, 'failed to parse webhook body json');
            }
        }
        const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid, msg_uuid, reply_uuid, } = body;
        console.log('=> incoming', msg_uuid, reply_uuid);
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
            bot_id,
            action,
            pubkey: pubkey || '',
            content: content || '',
            amount: amount || 0,
            bot_name: bot.name,
            chat_uuid: chat_uuid || '',
            reply_uuid: reply_uuid || '',
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
        const { bot_id, action, pubkey, route_hint, amount, content, bot_name, chat_uuid, msg_uuid, reply_uuid, } = a;
        let myBot;
        // not for tribe admin, for bot maker
        if (bot_id) {
            myBot = yield models_1.models.Bot.findOne({
                where: {
                    id: bot_id,
                },
            });
            if (chat_uuid) {
                const myChat = yield tribes_1.getTribeOwnersChatByUUID(chat_uuid);
                // ACTUALLY ITS A LOCAL (FOR MY TRIBE) message! kill myBot
                if (myChat)
                    myBot = null;
            }
        }
        // console.log("=> ACTION HIT", a);
        if (myBot) {
            // IM NOT ADMIN - its my bot and i need to forward to admin - there is a chat_uuid
            const owner = yield models_1.models.Contact.findOne({ where: { id: myBot.tenant } });
            // THIS is a bot member cmd res (i am bot maker)
            const botMember = yield models_1.models.BotMember.findOne({
                where: {
                    tribeUuid: chat_uuid,
                    botId: bot_id,
                    tenant: owner.id,
                },
            });
            if (!botMember)
                return console.log('no botMember');
            const dest = botMember.memberPubkey;
            if (!dest)
                return console.log('no dest to send to');
            const topic = `${dest}/${myBot.uuid}`;
            const data = {
                action,
                bot_id,
                bot_name,
                type: constants_1.default.message_types.bot_res,
                message: {
                    content: content || '',
                    amount: amount || 0,
                    uuid: msg_uuid || '',
                },
                chat: { uuid: chat_uuid || '' },
                sender: {
                    pub_key: String(owner.publicKey),
                    alias: bot_name,
                    role: 0,
                    route_hint,
                },
            };
            if (reply_uuid) {
                data.message.replyUuid = reply_uuid;
            }
            try {
                yield network.signAndSend({ dest, data, route_hint }, owner, topic);
            }
            catch (e) {
                console.log('=> couldnt mqtt publish');
            }
            return; // done
        }
        if (action === 'keysend') {
            return console.log('=> BOT KEYSEND to', pubkey);
            // if (!(pubkey && pubkey.length === 66 && amount)) {
            //     throw 'wrong params'
            // }
            // const destkey = pubkey
            // const opts = {
            //     dest: destkey,
            //     data: {},
            //     amt: Math.max((amount || 0), constants.min_sat_amount)
            // }
            // try {
            //     await network.signAndSend(opts, ownerPubkey)
            //     return ({ success: true })
            // } catch (e) {
            //     throw e
            // }
        }
        else if (action === 'broadcast') {
            console.log('=> BOT BROADCAST');
            if (!content)
                return console.log('no content');
            if (!chat_uuid)
                return console.log('no chat_uuid');
            const theChat = yield tribes_1.getTribeOwnersChatByUUID(chat_uuid);
            if (!(theChat && theChat.id))
                return console.log('no chat');
            if (theChat.type !== constants_1.default.chat_types.tribe)
                return console.log('not a tribe');
            const owner = yield models_1.models.Contact.findOne({
                where: { id: theChat.tenant },
            });
            const tenant = owner.id;
            const encryptedForMeText = rsa.encrypt(owner.contactKey, content);
            const encryptedText = rsa.encrypt(theChat.groupKey, content);
            const textMap = { chat: encryptedText };
            var date = new Date();
            date.setMilliseconds(0);
            const alias = bot_name || 'Bot';
            const botContactId = -1;
            const msg = {
                chatId: theChat.id,
                uuid: short.generate(),
                type: constants_1.default.message_types.bot_res,
                sender: botContactId,
                amount: amount || 0,
                date: date,
                messageContent: encryptedForMeText,
                remoteMessageContent: JSON.stringify(textMap),
                status: constants_1.default.statuses.confirmed,
                replyUuid: reply_uuid || '',
                createdAt: date,
                updatedAt: date,
                senderAlias: alias,
                tenant,
            };
            const message = yield models_1.models.Message.create(msg);
            socket.sendJson({
                type: 'message',
                response: jsonUtils.messageToJson(message, theChat, owner),
            }, tenant);
            // console.log("BOT BROADCASE MSG", owner.dataValues)
            // console.log('+++++++++> MSG TO BROADCAST', message.dataValues)
            yield network.sendMessage({
                chat: theChat,
                sender: Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId, role: constants_1.default.chat_roles.reader }),
                message: {
                    content: textMap,
                    id: message.id,
                    uuid: message.uuid,
                    replyUuid: message.replyUuid,
                },
                type: constants_1.default.message_types.bot_res,
                success: () => ({ success: true }),
                failure: (e) => {
                    return console.log(e);
                },
                isForwarded: true,
            });
        }
        else {
            return console.log('no action');
        }
    });
}
exports.finalAction = finalAction;
//# sourceMappingURL=api.js.map