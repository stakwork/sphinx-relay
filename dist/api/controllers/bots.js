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
const bots_1 = require("../bots");
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
        secret: crypto.randomBytes(16).toString('hex').toUpperCase()
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
// return bool whether this is legit to process
function processBotMessage(msg, chat, botInTribe) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('===> PROCESS BOT MSG');
        const txt = msg.message.content;
        console.log('===> txt', txt);
        if (txt.startsWith('/bot ')) {
            bots_1.emit(txt, chat.uuid);
        }
        else {
        }
        return true;
    });
}
exports.processBotMessage = processBotMessage;
/* intercept */
function installBot(botname, botInTribe) {
    console.log("INSTALL BOT NOW");
    // search registry for bot (by name)
    // need bot uuid and maker pubkey
    // send bot_install to bot maker
    // generate ChatMember with bot=true
    // bot_maker_pubkey, bot_uuid, bot_prefix
}
exports.installBot = installBot;
function receiveBotInstall(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> receiveBotInstall');
        // const dat = payload.content || payload
        // const sender_pub_key = dat.sender.pub_key
        // const tribe_uuid = dat.chat.uuid
        // verify tribe ownership (verify signed timestamp)
        // create BotMember for publishing to mqtt
    });
}
exports.receiveBotInstall = receiveBotInstall;
// type BotCmdType = 'install' | 'message' | 'broadcast' | 'keysend'
function receiveBotCmd(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(constants.message_types.bot_cmd);
    });
}
exports.receiveBotCmd = receiveBotCmd;
function receiveBotRes(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(constants.message_types.bot_res);
    });
}
exports.receiveBotRes = receiveBotRes;
//# sourceMappingURL=bots.js.map