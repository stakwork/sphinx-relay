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
// import * as short from 'short-uuid'
// import * as rsa from '../crypto/rsa'
// import { models } from '../models'
// import * as socket from '../utils/socket'
// import * as jsonUtils from '../utils/json'
const actions_1 = require("./actions");
const constants = require(path.join(__dirname, '../../config/constants.json'));
function broadcastAction(chat, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const a = {
            action: 'broadcast',
            text, chatID: chat.id,
            botName: 'MotherBot'
        };
        actions_1.finalActionProcess(a);
        // var date = new Date()
        // date.setMilliseconds(0)
        // const owner = await models.Contact.findOne({ where: { isOwner: true } })
        // const encryptedForMeText = rsa.encrypt(owner.contactKey, text)
        // const msg:{[k:string]:any}={
        // 	chatId: chat.id,
        // 	uuid: short.generate(),
        // 	type: constants.message_types.bot_res,
        // 	sender: -99,
        // 	amount: 0,
        // 	date: date,
        // 	messageContent: encryptedForMeText,
        // 	remoteMessageContent: '',
        // 	status: constants.statuses.confirmed,
        // 	createdAt: date,
        //   updatedAt: date,
        //   senderAlias: 'MotherBot'
        // }
        // const message = await models.Message.create(msg)
        // socket.sendJson({
        // 	type: 'message',
        // 	response: jsonUtils.messageToJson(message, chat, owner)
        // })
    });
}
// return whether this is legit to process
function processBotMessage(msg, chat, botInTribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const txt = msg.message.content;
        if (txt.startsWith('/bot ')) {
            const arr = txt.split(' ');
            if (arr.length < 2)
                return false;
            const cmd = arr[1];
            switch (cmd) {
                case 'install':
                    if (arr.length < 3)
                        return false;
                    installBot(arr[2], botInTribe);
                    return true;
                default:
                    broadcastAction(chat, botHelpHTML);
            }
        }
        else {
        }
        return true;
    });
}
exports.processBotMessage = processBotMessage;
const botHelpHTML = `<div>
  <b>Bot commands:</b>
  <ul>
    <li><b>/bot install {BOTNAME}:</b>&nbsp;Install a new bot
    <li><b>/bot help:</b>&nbsp;Print out this help message
  </ul>
<div>        
`;
/* intercept */
function installBot(botname, botInTribe) {
    console.log("INSTALL BOT NOW");
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