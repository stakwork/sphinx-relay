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
exports.getBagdeChatBot = exports.addPatToGitBot = exports.receiveBotRes = exports.buildBotPayload = exports.postToBotServer = exports.receiveBotCmd = exports.receiveBotInstall = exports.botKeysend = exports.keysendBotCmd = exports.keysendBotInstall = exports.installBotAsTribeAdmin = exports.deleteBot = exports.createBot = exports.getBots = void 0;
const tribes = require("../utils/tribes");
const crypto = require("crypto");
const models_1 = require("../models");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const network = require("../network");
const botapi_1 = require("./botapi");
const socket = require("../utils/socket");
const node_fetch_1 = require("node-fetch");
const SphinxBot = require("sphinx-bot");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
const short = require("short-uuid");
const git_1 = require("../builtin/git");
const rsa = require("../crypto/rsa");
const cert_1 = require("../utils/cert");
const getBots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    try {
        const bots = (yield models_1.models.Bot.findAll({
            where: { tenant },
        }));
        (0, res_1.success)(res, {
            bots: bots.map((b) => jsonUtils.botToJson(b)),
        });
    }
    catch (e) {
        (0, res_1.failure)(res, 'no bots');
    }
});
exports.getBots = getBots;
const createBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const { name, webhook, price_per_use, img, description, tags } = req.body;
    const uuid = yield tribes.genSignedTimestamp(req.owner.publicKey);
    const newBot = {
        name,
        uuid,
        webhook,
        id: crypto.randomBytes(12).toString('hex').toUpperCase(),
        secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
        pricePerUse: price_per_use || 0,
        tenant,
    };
    try {
        const theBot = (yield models_1.models.Bot.create(newBot));
        // post to tribes.sphinx.chat
        tribes.declare_bot({
            uuid,
            owner_pubkey: req.owner.publicKey,
            price_per_use,
            name: name,
            description: description || '',
            tags: tags || [],
            img: img || '',
            unlisted: false,
            deleted: false,
            owner_route_hint: req.owner.routeHint || '',
            owner_alias: req.owner.alias || '',
        });
        (0, res_1.success)(res, jsonUtils.botToJson(theBot));
    }
    catch (e) {
        (0, res_1.failure)(res, 'bot creation failed');
    }
});
exports.createBot = createBot;
const deleteBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const id = req.params.id;
    const owner_pubkey = req.owner.publicKey;
    if (!id || owner_pubkey)
        return;
    try {
        const bot = (yield models_1.models.Bot.findOne({
            where: { id, tenant },
        }));
        yield tribes.delete_bot({
            uuid: bot.uuid,
            owner_pubkey,
        });
        yield models_1.models.Bot.destroy({ where: { id, tenant } });
        (0, res_1.success)(res, true);
    }
    catch (e) {
        logger_1.sphinxLogger.error(['ERROR deleteBot', e]);
        (0, res_1.failure)(res, e);
    }
});
exports.deleteBot = deleteBot;
function installBotAsTribeAdmin(chat, bot_json) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = chat && chat.id;
        const chat_uuid = chat && chat.uuid;
        const tenant = chat.tenant;
        if (!chatId || !chat_uuid || !tenant)
            return logger_1.sphinxLogger.error('no chat id in installBot');
        logger_1.sphinxLogger.info(['=> chat to install bot into', chat.name]);
        const owner = (yield models_1.models.Contact.findOne({
            where: { id: tenant },
        }));
        if (!owner)
            return logger_1.sphinxLogger.error('cant find owner in installBotAsTribeAdmin');
        const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey);
        if (!isTribeOwner)
            return logger_1.sphinxLogger.error('=> only tribe owner can install bots');
        const { uuid, owner_pubkey, unique_name, price_per_use, owner_route_hint } = bot_json;
        const isLocal = owner_pubkey === owner.publicKey;
        let botType = constants_1.default.bot_types.remote;
        if (isLocal) {
            logger_1.sphinxLogger.info('=> install local bot now!');
            botType = constants_1.default.bot_types.local;
        }
        const chatBot = {
            chatId,
            botPrefix: '/' + unique_name,
            botType: botType,
            botUuid: uuid,
            botMakerPubkey: owner_pubkey,
            botMakerRouteHint: owner_route_hint || '',
            pricePerUse: price_per_use,
            tenant,
        };
        if (isLocal) {
            // "install" my local bot and send "INSTALL" event
            const myBot = (yield models_1.models.Bot.findOne({
                where: {
                    uuid: bot_json.uuid,
                    tenant,
                },
            }));
            if (myBot) {
                const success = yield postToBotServer({
                    type: constants_1.default.message_types.bot_install,
                    bot_uuid: myBot.uuid,
                    message: { content: '', amount: 0, uuid: short.generate() },
                    sender: {
                        id: owner.id,
                        pub_key: owner.publicKey,
                        alias: owner.alias,
                        role: constants_1.default.chat_roles.owner,
                    },
                    chat: { uuid: chat_uuid },
                }, myBot, SphinxBot.MSG_TYPE.INSTALL);
                if (success)
                    yield models_1.models.ChatBot.create(chatBot);
            }
        }
        else {
            // keysend to bot maker
            logger_1.sphinxLogger.info(['installBot INSTALL REMOTE BOT NOW', chatBot]);
            const succeeded = yield keysendBotInstall(chatBot, chat_uuid, owner);
            if (succeeded) {
                try {
                    // could fail
                    yield models_1.models.ChatBot.create(chatBot);
                }
                catch (e) {
                    //We want to do nothing here
                }
            }
        }
    });
}
exports.installBotAsTribeAdmin = installBotAsTribeAdmin;
function keysendBotInstall(b, chat_uuid, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants_1.default.message_types.bot_install, b.botUuid, b.botMakerPubkey, b.pricePerUse, chat_uuid, owner, b.botMakerRouteHint);
    });
}
exports.keysendBotInstall = keysendBotInstall;
function keysendBotCmd(msg, b, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        const amount = msg.message.amount || 0;
        const amt = Math.max(amount, b.pricePerUse);
        return yield botKeysend(constants_1.default.message_types.bot_cmd, b.botUuid, b.botMakerPubkey, amt, msg.chat.uuid, sender, b.botMakerRouteHint, msg);
    });
}
exports.keysendBotCmd = keysendBotCmd;
function botKeysend(msg_type, bot_uuid, botmaker_pubkey, amount, chat_uuid, sender, botmaker_route_hint, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = (msg && msg.message.content) || '';
        const sender_role = (msg && msg.sender && msg.sender.role) || constants_1.default.chat_roles.reader;
        const msg_uuid = (msg && msg.message.uuid) || short.generate();
        const sender_id = (msg && msg.sender && msg.sender.id) || sender.id;
        const reply_uuid = msg && msg.message.replyUuid;
        const parent_id = msg && msg.message.parentId;
        const dest = botmaker_pubkey;
        const amt = Math.max(amount || constants_1.default.min_sat_amount);
        const opts = {
            amt,
            dest,
            route_hint: botmaker_route_hint,
            data: {
                type: msg_type,
                bot_uuid,
                chat: { uuid: chat_uuid },
                message: {
                    content: content,
                    amount: amt,
                    uuid: msg_uuid,
                },
                sender: {
                    pub_key: sender.publicKey,
                    alias: sender.alias,
                    role: sender_role,
                    route_hint: sender.routeHint || '',
                },
            },
        };
        if (sender_id) {
            opts.data.sender.id = sender_id;
        }
        if (reply_uuid) {
            opts.data.message.replyUuid = reply_uuid;
        }
        if (parent_id) {
            opts.data.message.parentId = parent_id;
        }
        logger_1.sphinxLogger.info(['BOT MSG TO SEND!!!', opts.data]);
        try {
            yield network.signAndSend(opts, sender);
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
exports.botKeysend = botKeysend;
function receiveBotInstall(dat) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info(['=> receiveBotInstall', dat], logger_1.logging.Network);
        const sender_pub_key = dat.sender && dat.sender.pub_key;
        const bot_uuid = dat.bot_uuid;
        const chat_uuid = dat.chat && dat.chat.uuid;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid || !sender_pub_key || !bot_uuid)
            return logger_1.sphinxLogger.info('=> no chat uuid or sender pub key or bot_uuid');
        const bot = (yield models_1.models.Bot.findOne({
            where: {
                uuid: bot_uuid,
                tenant,
            },
        }));
        if (!bot)
            return;
        const verifiedOwnerPubkey = yield tribes.verifySignedTimestamp(bot_uuid);
        if (verifiedOwnerPubkey === owner.publicKey) {
            const botMember = {
                botId: bot.id,
                memberPubkey: sender_pub_key,
                tribeUuid: chat_uuid,
                msgCount: 0,
                tenant,
            };
            logger_1.sphinxLogger.info(['CREATE bot MEMBER', botMember]);
            yield models_1.models.BotMember.create(botMember);
        }
        const contact = (yield models_1.models.Contact.findOne({
            where: {
                tenant,
                publicKey: sender_pub_key,
            },
        }));
        if (!contact) {
            return logger_1.sphinxLogger.error('=> receiveBotInstall no contact');
        }
        // sender id needs to be in the msg
        dat.sender.id = contact.id || 0;
        postToBotServer(dat, bot, SphinxBot.MSG_TYPE.INSTALL);
    });
}
exports.receiveBotInstall = receiveBotInstall;
// ONLY FOR BOT MAKER
function receiveBotCmd(dat) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> receiveBotCmd', logger_1.logging.Network);
        const sender_pub_key = dat.sender.pub_key;
        const bot_uuid = dat.bot_uuid;
        const chat_uuid = dat.chat && dat.chat.uuid;
        const sender_id = dat.sender && dat.sender.id;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid || !bot_uuid)
            return logger_1.sphinxLogger.error('no chat uuid');
        // const amount = dat.message.amount - check price_per_use
        const bot = (yield models_1.models.Bot.findOne({
            where: {
                uuid: bot_uuid,
                tenant,
            },
        }));
        if (!bot)
            return;
        const botMember = (yield models_1.models.BotMember.findOne({
            where: {
                botId: bot.id,
                tribeUuid: chat_uuid,
                tenant,
            },
        }));
        if (!botMember)
            return;
        botMember.update({ msgCount: (botMember.msgCount || 0) + 1 });
        const contact = (yield models_1.models.Contact.findOne({
            where: {
                tenant,
                publicKey: sender_pub_key,
            },
        }));
        if (!contact) {
            return logger_1.sphinxLogger.error('=> receiveBotInstall no contact');
        }
        // sender id needs to be in the msg
        dat.sender.id = sender_id || 0;
        postToBotServer(dat, bot, SphinxBot.MSG_TYPE.MESSAGE);
        // forward to the entire Action back over MQTT
    });
}
exports.receiveBotCmd = receiveBotCmd;
function postToBotServer(msg, bot, route) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> postToBotServer', logger_1.logging.Network); //, payload)
        if (!bot) {
            logger_1.sphinxLogger.info('=> no bot', logger_1.logging.Network); //, payload)
            return false;
        }
        if (!bot.webhook || !bot.secret) {
            logger_1.sphinxLogger.info('=> no bot webook or secret', logger_1.logging.Network); //, payload)
            return false;
        }
        let url = bot.webhook;
        if (url.charAt(url.length - 1) === '/') {
            url += route;
        }
        else {
            url += '/' + route;
        }
        try {
            const r = yield (0, node_fetch_1.default)(url, {
                method: 'POST',
                body: JSON.stringify(buildBotPayload(msg)),
                headers: {
                    'x-secret': bot.secret,
                    'Content-Type': 'application/json',
                },
            });
            logger_1.sphinxLogger.info(['=> bot post:', r.status], logger_1.logging.Network);
            return r.ok;
        }
        catch (e) {
            logger_1.sphinxLogger.error(['=> bot post failed', e], logger_1.logging.Network);
            return false;
        }
    });
}
exports.postToBotServer = postToBotServer;
function buildBotPayload(msg) {
    const chat_uuid = msg.chat && msg.chat.uuid;
    const m = {
        id: msg.message.uuid,
        reply_id: msg.message.replyUuid,
        channel: {
            id: chat_uuid,
            send: function () { },
            pay: function () { },
        },
        content: msg.message.content,
        amount: msg.message.amount,
        type: msg.type,
        member: {
            id: msg.sender.id ? msg.sender.id + '' : '0',
            nickname: msg.sender.alias,
            roles: [],
        },
    };
    if (msg.sender.role === constants_1.default.chat_roles.owner) {
        if (m.member)
            m.member.roles = [
                {
                    name: 'Admin',
                },
            ];
    }
    return m;
}
exports.buildBotPayload = buildBotPayload;
function receiveBotRes(dat) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> receiveBotRes', logger_1.logging.Network); //, payload)
        if (!dat.chat || !dat.message || !dat.sender) {
            return logger_1.sphinxLogger.error('=> receiveBotRes error, no chat||msg||sender');
        }
        const chat_uuid = dat.chat && dat.chat.uuid;
        const sender_pub_key = dat.sender.pub_key;
        const amount = dat.message.amount || 0;
        const msg_uuid = dat.message.uuid || '';
        const reply_uuid = dat.message.replyUuid || '';
        const parent_id = dat.message.parentId || 0;
        const content = dat.message.content;
        const action = dat.action;
        const bot_name = dat.bot_name;
        const sender_alias = dat.sender.alias;
        const sender_pic = dat.sender.photo_url;
        const date_string = dat.message.date;
        const network_type = dat.network_type || 0;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid)
            return logger_1.sphinxLogger.error('=> receiveBotRes Error no chat_uuid');
        const chat = (yield models_1.models.Chat.findOne({
            where: { uuid: chat_uuid, tenant },
        }));
        if (!chat)
            return logger_1.sphinxLogger.error('=> receiveBotRes Error no chat');
        const tribeOwnerPubKey = chat && chat.ownerPubkey;
        const isTribeOwner = owner.publicKey === tribeOwnerPubKey;
        if (isTribeOwner) {
            // console.log("=> is tribeOwner, do finalAction!")
            // IF IS TRIBE ADMIN forward to the tribe
            // received the entire action?
            const bot_id = dat.bot_id;
            const recipient_id = dat.recipient_id;
            (0, botapi_1.finalAction)({
                bot_id,
                action,
                bot_name,
                chat_uuid,
                content,
                amount,
                reply_uuid,
                parent_id,
                msg_uuid,
                recipient_id,
            });
        }
        else {
            const theChat = (yield models_1.models.Chat.findOne({
                where: {
                    uuid: chat_uuid,
                    tenant,
                },
            }));
            if (!chat)
                return logger_1.sphinxLogger.error('=> receiveBotRes as sub error no chat');
            let date = new Date();
            date.setMilliseconds(0);
            if (date_string)
                date = new Date(date_string);
            const sender = (yield models_1.models.Contact.findOne({
                where: { publicKey: sender_pub_key, tenant },
            }));
            const msg = {
                chatId: chat.id,
                uuid: msg_uuid,
                replyUuid: reply_uuid,
                type: constants_1.default.message_types.bot_res,
                sender: (sender && sender.id) || 0,
                amount: amount || 0,
                date: date,
                messageContent: content,
                status: constants_1.default.statuses.confirmed,
                createdAt: date,
                updatedAt: date,
                senderAlias: sender_alias || 'Bot',
                senderPic: sender_pic,
                network_type,
                tenant,
            };
            if (parent_id)
                msg.parentId = parent_id;
            const message = (yield models_1.models.Message.create(msg));
            socket.sendJson({
                type: 'message',
                response: jsonUtils.messageToJson(message, theChat, owner),
            }, tenant);
        }
    });
}
exports.receiveBotRes = receiveBotRes;
const addPatToGitBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    if (!req.body.encrypted_pat)
        return (0, res_1.failure)(res, 'no pat');
    const transportTokenKey = yield (0, cert_1.getTransportKey)();
    const pat = rsa.decrypt(transportTokenKey, req.body.encrypted_pat);
    if (!pat)
        return (0, res_1.failure)(res, 'failed to decrypt pat');
    try {
        yield (0, git_1.updateGitBotPat)(tenant, pat);
        (0, res_1.success)(res, { updated: true });
    }
    catch (e) {
        (0, res_1.failure)(res, 'no bots');
    }
});
exports.addPatToGitBot = addPatToGitBot;
const getBagdeChatBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const chatId = req.params.chatId;
    if (!chatId)
        return;
    const tenant = req.owner.id;
    try {
        const badgeChatBot = yield models_1.models.ChatBot.findOne({
            where: { chatId, tenant, botPrefix: '/badge' },
        });
        return (0, res_1.success)(res, badgeChatBot);
    }
    catch (error) {
        logger_1.sphinxLogger.error(['=> could bot get badge chat Bot', error], logger_1.logging.Bots);
        (0, res_1.failure)(res, 'could bot get badge chat Bot');
    }
});
exports.getBagdeChatBot = getBagdeChatBot;
//# sourceMappingURL=bots.js.map