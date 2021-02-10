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
exports.receiveBotRes = exports.buildBotPayload = exports.postToBotServer = exports.receiveBotCmd = exports.receiveBotInstall = exports.botKeysend = exports.keysendBotCmd = exports.keysendBotInstall = exports.installBotAsTribeAdmin = exports.deleteBot = exports.createBot = exports.getBots = void 0;
const tribes = require("../utils/tribes");
const crypto = require("crypto");
const models_1 = require("../models");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const network = require("../network");
const api_1 = require("./api");
const socket = require("../utils/socket");
const node_fetch_1 = require("node-fetch");
const SphinxBot = require("sphinx-bot");
const constants_1 = require("../constants");
const getBots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const tenant = req.owner.id;
    try {
        const bots = yield models_1.models.Bot.findAll({ where: { tenant } });
        res_1.success(res, {
            bots: bots.map(b => jsonUtils.botToJson(b))
        });
    }
    catch (e) {
        res_1.failure(res, 'no bots');
    }
});
exports.getBots = getBots;
const createBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const tenant = req.owner.id;
    const { name, webhook, price_per_use, img, description, tags, } = req.body;
    const uuid = yield tribes.genSignedTimestamp(req.owner.publicKey);
    const newBot = {
        name, uuid, webhook,
        id: crypto.randomBytes(12).toString('hex').toUpperCase(),
        secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
        pricePerUse: price_per_use || 0,
        tenant
    };
    try {
        const theBot = yield models_1.models.Bot.create(newBot);
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
        });
        res_1.success(res, jsonUtils.botToJson(theBot));
    }
    catch (e) {
        res_1.failure(res, 'bot creation failed');
    }
});
exports.createBot = createBot;
const deleteBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const tenant = req.owner.id;
    const id = req.params.id;
    if (!id)
        return;
    try {
        models_1.models.Bot.destroy({ where: { id, tenant } });
        res_1.success(res, true);
    }
    catch (e) {
        console.log('ERROR deleteBot', e);
        res_1.failure(res, e);
    }
});
exports.deleteBot = deleteBot;
function installBotAsTribeAdmin(chat, bot_json) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = chat && chat.id;
        const chat_uuid = chat && chat.uuid;
        const tenant = chat.tenant;
        if (!chatId || !chat_uuid || !tenant)
            return console.log('no chat id in installBot');
        console.log("=> chat to install bot into", chat.name);
        const owner = yield models_1.models.Contact.findOne({ where: { id: tenant } });
        if (!owner)
            return console.log('cant find owner in installBotAsTribeAdmin');
        const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey);
        if (!isTribeOwner)
            return console.log('=> only tribe owner can install bots');
        const { uuid, owner_pubkey, unique_name, price_per_use } = bot_json;
        const isLocal = owner_pubkey === owner.publicKey;
        let botType = constants_1.default.bot_types.remote;
        if (isLocal) {
            console.log('=> install local bot now!');
            botType = constants_1.default.bot_types.local;
        }
        const chatBot = {
            chatId,
            botPrefix: '/' + unique_name,
            botType: botType,
            botUuid: uuid,
            botMakerPubkey: owner_pubkey,
            pricePerUse: price_per_use,
            tenant
        };
        if (isLocal) {
            // "install" my local bot and send "INSTALL" event
            const myBot = yield models_1.models.Bot.findOne({
                where: {
                    uuid: bot_json.uuid, tenant
                }
            });
            if (myBot) {
                yield models_1.models.ChatBot.create(chatBot);
                postToBotServer({
                    type: constants_1.default.message_types.bot_install,
                    bot_uuid: myBot.uuid,
                    message: { content: '', amount: 0 },
                    sender: {
                        pub_key: owner.publicKey,
                        alias: owner.alias,
                        role: constants_1.default.chat_roles.owner
                    },
                    chat: { uuid: chat_uuid }
                }, myBot, SphinxBot.MSG_TYPE.INSTALL);
            }
        }
        else {
            // keysend to bot maker
            console.log("installBot INSTALL REMOTE BOT NOW", chatBot);
            const succeeded = yield keysendBotInstall(chatBot, chat_uuid, owner);
            if (succeeded) {
                try { // could fail
                    yield models_1.models.ChatBot.create(chatBot);
                }
                catch (e) { }
            }
        }
    });
}
exports.installBotAsTribeAdmin = installBotAsTribeAdmin;
function keysendBotInstall(b, chat_uuid, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants_1.default.message_types.bot_install, b.botUuid, b.botMakerPubkey, b.pricePerUse, chat_uuid, owner);
    });
}
exports.keysendBotInstall = keysendBotInstall;
function keysendBotCmd(msg, b, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const amount = msg.message.amount || 0;
        const amt = Math.max(amount, b.pricePerUse);
        return yield botKeysend(constants_1.default.message_types.bot_cmd, b.botUuid, b.botMakerPubkey, amt, msg.chat.uuid, owner, msg.message.content, (msg.sender && msg.sender.role));
    });
}
exports.keysendBotCmd = keysendBotCmd;
function botKeysend(msg_type, bot_uuid, botmaker_pubkey, amount, chat_uuid, owner, content, sender_role) {
    return __awaiter(this, void 0, void 0, function* () {
        const dest = botmaker_pubkey;
        const amt = Math.max(amount || constants_1.default.min_sat_amount);
        const opts = {
            amt,
            dest,
            data: {
                type: msg_type,
                bot_uuid,
                chat: { uuid: chat_uuid },
                message: { content: content || '', amount: amt },
                sender: {
                    pub_key: owner.publicKey,
                    alias: owner.alias,
                    role: sender_role || constants_1.default.chat_roles.reader
                }
            }
        };
        try {
            yield network.signAndSend(opts, owner);
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
exports.botKeysend = botKeysend;
function receiveBotInstall(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveBotInstall', payload);
        const dat = payload.content || payload;
        const sender_pub_key = dat.sender && dat.sender.pub_key;
        const bot_uuid = dat.bot_uuid;
        const chat_uuid = dat.chat && dat.chat.uuid;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid || !sender_pub_key)
            return console.log('no chat uuid or sender pub key');
        const bot = yield models_1.models.Bot.findOne({
            where: {
                uuid: bot_uuid, tenant
            }
        });
        if (!bot)
            return;
        const verifiedOwnerPubkey = yield tribes.verifySignedTimestamp(bot_uuid);
        if (verifiedOwnerPubkey === owner.publicKey) {
            const botMember = {
                botId: bot.id,
                memberPubkey: sender_pub_key,
                tribeUuid: chat_uuid,
                msgCount: 0,
                tenant
            };
            console.log("CREATE bot MEMBER", botMember);
            yield models_1.models.BotMember.create(botMember);
        }
        //- need to pub back MQTT bot_install??
        //- and if the pubkey=the botOwnerPubkey, confirm chatbot?
        // NO - send a /guildjoin msg to BOT lib!
        // and add routes to lib express with the strings for MSG_TYPE
        // and here - postToBotServer /install (also do this for /uninstall)
        postToBotServer(payload, bot, SphinxBot.MSG_TYPE.INSTALL);
    });
}
exports.receiveBotInstall = receiveBotInstall;
// ONLY FOR BOT MAKER
function receiveBotCmd(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> receiveBotCmd", payload);
        const dat = payload.content || payload;
        // const sender_pub_key = dat.sender.pub_key
        const bot_uuid = dat.bot_uuid;
        const chat_uuid = dat.chat && dat.chat.uuid;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid)
            return console.log('no chat uuid');
        // const amount = dat.message.amount - check price_per_use
        const bot = yield models_1.models.Bot.findOne({
            where: {
                uuid: bot_uuid, tenant
            }
        });
        if (!bot)
            return;
        const botMember = yield models_1.models.BotMember.findOne({
            where: {
                botId: bot.id,
                tribeUuid: chat_uuid,
                tenant
            }
        });
        if (!botMember)
            return;
        botMember.update({ msgCount: (botMember || 0) + 1 });
        console.log('=> post to remote BOT!!!!! bot owner');
        postToBotServer(payload, bot, SphinxBot.MSG_TYPE.MESSAGE);
        // forward to the entire Action back over MQTT
    });
}
exports.receiveBotCmd = receiveBotCmd;
function postToBotServer(msg, bot, route) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bot)
            return false;
        if (!bot.webhook || !bot.secret)
            return false;
        let url = bot.webhook;
        if (url.charAt(url.length - 1) === '/') {
            url += route;
        }
        else {
            url += ('/' + route);
        }
        const r = yield node_fetch_1.default(url, {
            method: 'POST',
            body: JSON.stringify(buildBotPayload(msg)),
            headers: {
                'x-secret': bot.secret,
                'Content-Type': 'application/json'
            }
        });
        return r.ok;
    });
}
exports.postToBotServer = postToBotServer;
function buildBotPayload(msg) {
    const chat_uuid = msg.chat && msg.chat.uuid;
    const m = {
        channel: {
            id: chat_uuid,
            send: function () { },
        },
        reply: function () { },
        content: msg.message.content,
        amount: msg.message.amount,
        type: msg.type,
        member: {
            id: msg.sender.pub_key,
            nickname: msg.sender.alias,
            roles: []
        }
    };
    if (msg.sender.role === constants_1.default.chat_roles.owner) {
        if (m.member)
            m.member.roles = [{
                    name: 'Admin'
                }];
    }
    return m;
}
exports.buildBotPayload = buildBotPayload;
function receiveBotRes(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> receiveBotRes"); //, payload)
        const dat = payload.content || payload;
        if (!dat.chat || !dat.message || !dat.sender) {
            return console.log('=> receiveBotRes error, no chat||msg||sender');
        }
        const chat_uuid = dat.chat && dat.chat.uuid;
        const sender_pub_key = dat.sender.pub_key;
        const amount = dat.message.amount || 0;
        const msg_uuid = dat.message.uuid || '';
        const content = dat.message.content;
        const action = dat.action;
        const bot_name = dat.bot_name;
        const sender_alias = dat.sender.alias;
        const sender_pic = dat.sender_photo_url;
        const date_string = dat.message.date;
        const network_type = dat.network_type || 0;
        const owner = dat.owner;
        const tenant = owner.id;
        if (!chat_uuid)
            return console.log('=> receiveBotRes Error no chat_uuid');
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid, tenant } });
        if (!chat)
            return console.log('=> receiveBotRes Error no chat');
        const tribeOwnerPubKey = chat && chat.ownerPubkey;
        const isTribeOwner = owner.publicKey === tribeOwnerPubKey;
        if (isTribeOwner) {
            console.log("=> is tribeOwner, do finalAction!");
            // IF IS TRIBE ADMIN forward to the tribe
            // received the entire action?
            const bot_id = payload.bot_id;
            api_1.finalAction({
                bot_id, action, bot_name, chat_uuid, content, amount,
            });
        }
        else {
            const theChat = yield models_1.models.Chat.findOne({
                where: {
                    uuid: chat_uuid, tenant
                }
            });
            if (!chat)
                return console.log('=> receiveBotRes as sub error no chat');
            var date = new Date();
            date.setMilliseconds(0);
            if (date_string)
                date = new Date(date_string);
            const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key, tenant } });
            const msg = {
                chatId: chat.id,
                uuid: msg_uuid,
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
                tenant
            };
            const message = yield models_1.models.Message.create(msg);
            socket.sendJson({
                type: 'message',
                response: jsonUtils.messageToJson(message, theChat, owner)
            }, tenant);
        }
    });
}
exports.receiveBotRes = receiveBotRes;
//# sourceMappingURL=bots.js.map