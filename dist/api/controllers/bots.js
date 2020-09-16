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
const tribes = require("../utils/tribes");
const crypto = require("crypto");
const models_1 = require("../models");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const network = require("../network");
const intercept = require("../network/intercept");
const actions_1 = require("./actions");
const socket = require("../utils/socket");
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
    const { name, webhook, price_per_use, img, description, tags, } = req.body;
    const uuid = yield tribes.genSignedTimestamp();
    const newBot = {
        name, uuid, webhook,
        id: crypto.randomBytes(12).toString('hex').toUpperCase(),
        secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
        pricePerUse: price_per_use || 0
    };
    try {
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const theBot = yield models_1.models.Bot.create(newBot);
        // post to tribes.sphinx.chat
        tribes.declare_bot({
            uuid,
            owner_pubkey: owner.publicKey,
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
function installBot(chat, bot_json) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = chat && chat.id;
        const chat_uuid = chat && chat.uuid;
        if (!chatId || !chat_uuid)
            return console.log('no chat id in installBot');
        console.log("=> chat to install bot into", chat);
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey);
        if (!isTribeOwner)
            return console.log('=> only tribe owner can install bots');
        const { uuid, owner_pubkey, unique_name, price_per_use } = bot_json;
        const chatBot = {
            chatId,
            botPrefix: '/' + unique_name,
            botType: constants.bot_types.remote,
            botUuid: uuid,
            botMakerPubkey: owner_pubkey,
            pricePerUse: price_per_use
        };
        console.log("installBot INSTALL BOT NOW", chatBot);
        const succeeded = yield keysendBotInstall(chatBot, chat_uuid);
        if (succeeded)
            models_1.models.ChatBot.create(chatBot);
    });
}
exports.installBot = installBot;
function keysendBotInstall(b, chat_uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_install, b.botUuid, b.botMakerPubkey, b.pricePerUse, chat_uuid);
    });
}
exports.keysendBotInstall = keysendBotInstall;
function keysendBotCmd(msg, b) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_cmd, b.botUuid, b.botMakerPubkey, b.pricePerUse, msg.chat.uuid, msg.message.content);
    });
}
exports.keysendBotCmd = keysendBotCmd;
function botKeysend(msg_type, bot_uuid, botmaker_pubkey, price_per_use, chat_uuid, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const MIN_SATS = 3;
        const destkey = botmaker_pubkey;
        const opts = {
            dest: destkey,
            data: {
                type: msg_type,
                bot_uuid,
                message: { content: content || '' },
                sender: {
                    pub_key: owner.publicKey,
                },
                chat: {
                    uuid: chat_uuid
                }
            },
            amt: Math.max(price_per_use || MIN_SATS)
        };
        try {
            yield network.signAndSend(opts);
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
exports.botKeysend = botKeysend;
/*
=> receiveBotInstall {
  type: 23,
  bot_uuid: 'X1_sGR-WM_e29YL5100WA_P_VeYwvEsXfgc2NUhMzLNrNbWy2BVot9bVHnsXyPVmzoHleCYUn8oyUiDzE89Do1acLu6G',
  message: { content: '', amount: 3 },
  sender: {
    pub_key: '037bac010f84ef785ddc3ade66d008d76d90d80eab6e148c00ea4ba102c07f2e53'
  },
  chat: {}
}
no chat uuid or sender pub key
*/
function receiveBotInstall(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveBotInstall', payload);
        const dat = payload.content || payload;
        const sender_pub_key = dat.sender && dat.sender.pub_key;
        const bot_uuid = dat.bot_uuid;
        const chat_uuid = dat.chat && dat.chat.uuid;
        if (!chat_uuid || !sender_pub_key)
            return console.log('no chat uuid or sender pub key');
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const bot = yield models_1.models.Bot.findOne({ where: {
                uuid: bot_uuid
            } });
        if (!bot)
            return;
        const verifiedOwnerPubkey = yield tribes.verifySignedTimestamp(bot_uuid);
        if (verifiedOwnerPubkey === owner.publicKey) {
            const botMember = {
                botId: bot.id,
                memberPubkey: sender_pub_key,
                tribeUuid: chat_uuid,
                msgCount: 0,
            };
            console.log("CREATE bot MEMBER", botMember);
            yield models_1.models.BotMember.create(botMember);
        }
        //- need to pub back MQTT bot_install??
        //- and if the pubkey=the botOwnerPubkey, confirm chatbot?
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
        if (!chat_uuid)
            return console.log('no chat uuid');
        // const amount = dat.message.amount - check price_per_use
        const bot = yield models_1.models.Bot.findOne({ where: {
                uuid: bot_uuid
            } });
        if (!bot)
            return;
        const botMember = yield models_1.models.BotMember.findOne({ where: {
                botId: bot.id,
                tribeUuid: chat_uuid,
            } });
        if (!botMember)
            return;
        botMember.update({ msgCount: (botMember || 0) + 1 });
        console.log('=> post to remote BOT!!!!! bot owner');
        return intercept.postToBotServer(payload, bot);
        // forward to the entire Action back over MQTT
    });
}
exports.receiveBotCmd = receiveBotCmd;
function receiveBotRes(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> receiveBotRes", payload);
        const dat = payload.content || payload;
        if (!dat.chat || !dat.message || !dat.sender) {
            return console.log('=> receiveBotRes error, no chat||msg||sender');
        }
        const chat_uuid = dat.chat && dat.chat.uuid;
        const sender_pub_key = dat.sender.pub_key;
        const amount = dat.message.amount;
        const msg_uuid = dat.message.uuid || '';
        const content = dat.message.content;
        const botName = dat.message.bot_name;
        if (!chat_uuid)
            return console.log('=> receiveBotRes Error no chat_uuid');
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        if (!chat)
            return console.log('=> receiveBotRes Error no chat');
        const tribeOwnerPubKey = chat && chat.ownerPubkey;
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const isTribeOwner = owner.publicKey === tribeOwnerPubKey;
        if (isTribeOwner) {
            // IF IS TRIBE ADMIN forward to the tribe
            // received the entire action?
            const bot_id = payload.bot_id;
            actions_1.finalAction(payload.message, bot_id);
        }
        else {
            const theChat = yield models_1.models.Chat.findOne({ where: {
                    uuid: chat_uuid
                } });
            if (!chat)
                return console.log('=> receiveBotRes as sub error no chat');
            var date = new Date();
            date.setMilliseconds(0);
            const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key } });
            const msg = {
                chatId: chat.id,
                uuid: msg_uuid,
                type: constants.message_types.bot_res,
                sender: (sender && sender.id) || 0,
                amount: amount || 0,
                date: date,
                messageContent: content,
                status: constants.statuses.confirmed,
                createdAt: date,
                updatedAt: date,
                senderAlias: botName || 'Bot',
            };
            const message = yield models_1.models.Message.create(msg);
            socket.sendJson({
                type: 'message',
                response: jsonUtils.messageToJson(message, theChat, owner)
            });
        }
    });
}
exports.receiveBotRes = receiveBotRes;
//# sourceMappingURL=bots.js.map