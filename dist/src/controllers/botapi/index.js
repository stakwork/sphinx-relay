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
exports.finalAction = exports.processAction = exports.processWebhook = void 0;
const network = require("../../network");
const models_1 = require("../../models");
const res_1 = require("../../utils/res");
const constants_1 = require("../../constants");
const tribes_1 = require("../../utils/tribes");
const broadcast_1 = require("./broadcast");
const pay_1 = require("./pay");
const logger_1 = require("../../utils/logger");
const hmac = require("../../crypto/hmac");
const git_1 = require("../../builtin/git");
const helpers_1 = require("../../helpers");
const githook_1 = require("../../utils/githook");
function processWebhook(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info(`=> processWebhook ${req.body}`);
        const sig = req.headers['x-hub-signature-256'];
        if (!sig) {
            return (0, res_1.unauthorized)(res);
        }
        const event = req.body;
        let repo = '';
        if ('repository' in event) {
            repo = ((_a = event.repository) === null || _a === void 0 ? void 0 : _a.full_name.toLowerCase()) || '';
        }
        if (!repo) {
            return (0, res_1.unauthorized)(res);
        }
        let ok = false;
        try {
            // for all "owners"
            const allChatBots = yield models_1.models.ChatBot.findAll({
                where: { botUuid: git_1.GITBOT_UUID },
            });
            const allGitBots = yield models_1.models.Bot.findAll({
                where: { uuid: git_1.GITBOT_UUID },
            });
            yield (0, helpers_1.asyncForEach)(allChatBots, (cb) => __awaiter(this, void 0, void 0, function* () {
                const meta = cb.meta ? JSON.parse(cb.meta) : { repos: [] };
                yield (0, helpers_1.asyncForEach)(meta.repos, (r) => __awaiter(this, void 0, void 0, function* () {
                    if (r.path.toLowerCase() === repo.toLowerCase()) {
                        const gitbot = allGitBots.find((gb) => gb.tenant === cb.tenant);
                        if (gitbot) {
                            const valid = hmac.verifyHmac(sig, req.rawBody, gitbot.secret);
                            if (valid) {
                                ok = true;
                                // process!
                                const chat = yield models_1.models.Chat.findOne({
                                    where: { id: cb.chatId },
                                });
                                if (chat) {
                                    const content = (0, githook_1.processGithook)(req.body);
                                    if (content) {
                                        const a = {
                                            action: 'broadcast',
                                            bot_id: gitbot.id,
                                            chat_uuid: chat.uuid,
                                            amount: 0,
                                            bot_name: gitbot.name,
                                            content,
                                            bot_pic: git_1.GITBOT_PIC,
                                        };
                                        yield (0, broadcast_1.default)(a);
                                    }
                                    else {
                                        logger_1.sphinxLogger.debug('no content!!! (gitbot)');
                                    }
                                }
                                else {
                                    logger_1.sphinxLogger.debug('no chat (gitbot)');
                                }
                            }
                            else {
                                logger_1.sphinxLogger.debug('HMAC nOt VALID (gitbot)');
                            }
                        }
                        else {
                            logger_1.sphinxLogger.debug('no matching gitbot (gitbot)');
                        }
                    }
                    else {
                        logger_1.sphinxLogger.debug('no repo match (gitbot)');
                    }
                }));
            }));
        }
        catch (e) {
            logger_1.sphinxLogger.error('failed to process webhook', e);
            (0, res_1.unauthorized)(res);
        }
        if (ok)
            (0, res_1.success)(res, { ok: true });
        else
            (0, res_1.unauthorized)(res);
    });
}
exports.processWebhook = processWebhook;
function processAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info(`=> processAction ${req.body}`);
        let body = req.body;
        if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
            try {
                // parse out body from "data" for github webhook action
                const dataBody = JSON.parse(body.data.replace(/'/g, '"'));
                if (dataBody)
                    body = dataBody;
            }
            catch (e) {
                logger_1.sphinxLogger.error(e);
                return (0, res_1.failure)(res, 'failed to parse webhook body json');
            }
        }
        const { action, bot_id, bot_secret, pubkey, amount, content, chat_uuid, msg_uuid, reply_uuid, recipient_id, parent_id, } = body;
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
            parent_id: parent_id || 0,
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
        const { bot_id, action, pubkey, route_hint, amount, content, bot_name, chat_uuid, msg_uuid, reply_uuid, parent_id, recipient_id, } = a;
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
                return logger_1.sphinxLogger.error(`no botMember`);
            const dest = botMember.memberPubkey;
            if (!dest)
                return logger_1.sphinxLogger.error(`no dest to send to`);
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
            if (parent_id) {
                data.message.parentId = parent_id;
            }
            try {
                yield network.signAndSend({ dest, data, route_hint }, owner, topic);
            }
            catch (e) {
                logger_1.sphinxLogger.error(`=> couldnt mqtt publish`);
            }
            return; // done
        }
        if (action === 'keysend') {
            return logger_1.sphinxLogger.info(`=> BOT KEYSEND to ${pubkey}`);
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
            return logger_1.sphinxLogger.error(`invalid action`);
        }
    });
}
exports.finalAction = finalAction;
//# sourceMappingURL=index.js.map