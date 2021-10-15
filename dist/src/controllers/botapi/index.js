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
const network = require("../../network");
const models_1 = require("../../models");
const res_1 = require("../../utils/res");
const constants_1 = require("../../constants");
const tribes_1 = require("../../utils/tribes");
const broadcast_1 = require("./broadcast");
const pay_1 = require("./pay");
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
                return (0, res_1.failure)(res, 'failed to parse webhook body json');
            }
        }
        const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid, msg_uuid, reply_uuid, recipient_id, } = body;
        if (!bot_id)
            return (0, res_1.failure)(res, 'no bot_id');
        const bot = yield models_1.models.Bot.findOne({ where: { id: bot_id } });
        if (!bot)
            return (0, res_1.failure)(res, 'no bot');
        if (!(bot.secret && bot.secret === bot_secret)) {
            return (0, res_1.failure)(res, 'wrong secret');
        }
        if (!action) {
            return (0, res_1.failure)(res, 'no action');
        }
        const a = {
            bot_id,
            action,
            pubkey: pubkey || '',
            content: content || '',
            amount: amount || 0,
            bot_name: bot.name,
            chat_uuid: chat_uuid || '',
            msg_uuid: msg_uuid || '',
            reply_uuid: reply_uuid || '',
            recipient_id: recipient_id ? parseInt(recipient_id) : 0,
        };
        try {
            const r = yield finalAction(a);
            (0, res_1.success)(res, r);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.processAction = processAction;
function finalAction(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { bot_id, action, pubkey, route_hint, amount, content, bot_name, chat_uuid, msg_uuid, reply_uuid, recipient_id, } = a;
        let myBot;
        // not for tribe admin, for bot maker
        if (bot_id) {
            myBot = yield models_1.models.Bot.findOne({
                where: {
                    id: bot_id,
                },
            });
            if (chat_uuid) {
                const myChat = yield (0, tribes_1.getTribeOwnersChatByUUID)(chat_uuid);
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
                    alias: bot_name || '',
                    role: 0,
                    route_hint,
                }, // for verify sig
            };
            if (recipient_id) {
                data.recipient_id = recipient_id;
            }
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
        else if (action === 'pay') {
            (0, pay_1.default)(a);
        }
        else if (action === 'broadcast') {
            (0, broadcast_1.default)(a);
        }
        else {
            return console.log('invalid action');
        }
    });
}
exports.finalAction = finalAction;
//# sourceMappingURL=index.js.map