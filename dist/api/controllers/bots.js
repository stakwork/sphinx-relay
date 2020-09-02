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
const constants = require(path.join(__dirname, '../../config/constants.json'));
/* intercept */
exports.installBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // need bot uuid and maker pubkey
    // send bot_install to bot maker
    // mqtt sub to the bot uuid (dont need this actually)
    // generate ChatMember with bot=true
    // bot_maker_pubkey, bot_uuid, bot_prefix
});
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
// type BotResType = 'install' | 'message' | 'broadcast' | 'keysend'
function receiveBotRes(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(constants.message_types.bot_res);
    });
}
exports.receiveBotRes = receiveBotRes;
//# sourceMappingURL=bots.js.map