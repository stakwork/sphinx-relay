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
    const { name, webhook } = req.body;
    const uuid = yield tribes.genSignedTimestamp();
    const newBot = {
        name, uuid, webhook,
        id: crypto.randomBytes(12).toString('hex').toUpperCase(),
        secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
        pricePerUse: 0
    };
    try {
        const theBot = yield models_1.models.Bot.create(newBot);
        // post to bots.sphinx.chat
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
// async function broadcastAction(chat,text){
//   finalAction(<Action>{
//     action:'broadcast',
//     text, chatUUID: chat.uuid,
//     botName:'MotherBot'
//   })
// }
function installBot(botname, botInTribe) {
    console.log("INSTALL BOT NOW");
    // search registry for bot (by name)
    // need bot uuid and maker pubkey
    // send bot_install to bot maker
    // generate ChatMember with bot=true
    // bot_maker_pubkey, bot_uuid, bot_prefix
}
exports.installBot = installBot;
function sendBotInstall(_, b) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_install, b.botUuid, b.botMakerPubkey, b.pricePerUse);
    });
}
exports.sendBotInstall = sendBotInstall;
function sendBotCmd(msg, b) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield botKeysend(constants.message_types.bot_cmd, b.botUuid, b.botMakerPubkey, b.pricePerUse, msg.message.content);
    });
}
exports.sendBotCmd = sendBotCmd;
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