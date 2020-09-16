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
        // post to bots.sphinx.chat
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
function installBot(chatId, bot_json) {
    return __awaiter(this, void 0, void 0, function* () {
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
        keysendBotInstall(chatBot);
        yield models_1.models.ChatBot.create(chatBot);
    });
}
exports.installBot = installBot;
function keysendBotInstall(b) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_install, b.botUuid, b.botMakerPubkey, b.pricePerUse);
    });
}
exports.keysendBotInstall = keysendBotInstall;
function keysendBotCmd(msg, b) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_cmd, b.botUuid, b.botMakerPubkey, b.pricePerUse, msg.message.content);
    });
}
exports.keysendBotCmd = keysendBotCmd;
function receiveBotInstall(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveBotInstall');
        // const dat = payload.content || payload
        // const sender_pub_key = dat.sender.pub_key
        // const bot_uuid = dat.bot_uuid
        // verify tribe ownership (verify signed timestamp)
        // CHECK PUBKEY - is it me? install it! (create botmember)
        // if the pubkey=the botOwnerPubkey, (create chatbot)
    });
}
exports.receiveBotInstall = receiveBotInstall;
function botKeysend(msg_type, bot_uuid, botmaker_pubkey, price_per_use, content) {
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
// type BotCmdType = 'install' | 'message' | 'broadcast' | 'keysend'
function receiveBotCmd(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> receiveBotCmd");
        console.log(constants.message_types.bot_cmd);
        // forward to the entire Action back
        // const dat = payload.content || payload
        // const sender_pub_key = dat.sender.pub_key
        // const bot_uuid = dat.bot_uuid
        // const content = dat.message.content - check prefix
        // const amount = dat.message.amount
    });
}
exports.receiveBotCmd = receiveBotCmd;
function receiveBotRes(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> receiveBotRes");
        console.log(constants.message_types.bot_res);
        // forward to the tribe
        // received the entire action?
    });
}
exports.receiveBotRes = receiveBotRes;
//# sourceMappingURL=bots.js.map