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
const res_1 = require("../utils/res");
const path = require("path");
const fs = require("fs");
const network = require("../network");
const models_1 = require("../models");
const short = require("short-uuid");
const rsa = require("../crypto/rsa");
/*
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/
const actionFile = '../../../actions.json';
const constants = require(path.join(__dirname, '../../config/constants.json'));
function doAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const thePath = path.join(__dirname, actionFile);
        try {
            if (fs.existsSync(thePath)) {
                processExtra(req, res);
            }
            else {
                res_1.failure(res, 'no file');
            }
        }
        catch (err) {
            console.error(err);
            res_1.failure(res, 'fail');
        }
    });
}
exports.doAction = doAction;
function processExtra(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const actions = require(path.join(__dirname, actionFile));
        if (!(actions && actions.length)) {
            return res_1.failure(res, 'no actions defined');
        }
        const { action, app, secret, pubkey, amount, chat_uuid, text } = req.body;
        const theApp = actions.find(a => a.app === app);
        if (!theApp) {
            return res_1.failure(res, 'app not found');
        }
        if (!(theApp.secret && theApp.secret === secret)) {
            return res_1.failure(res, 'wrong secret');
        }
        if (!action) {
            return res_1.failure(res, 'no action');
        }
        if (action === 'keysend') {
            if (!(pubkey && pubkey.length === 66 && amount)) {
                return res_1.failure(res, 'wrong params');
            }
            const MIN_SATS = 3;
            const destkey = pubkey;
            const opts = {
                dest: destkey,
                data: {},
                amt: Math.max((amount || 0), MIN_SATS)
            };
            try {
                yield network.signAndSend(opts);
                return res_1.success(res, { success: true });
            }
            catch (e) {
                return res_1.failure(res, e);
            }
        }
        else if (action === 'broadcast') {
            if (!chat_uuid || !text)
                return res_1.failure(res, 'no uuid or text');
            const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            const theChat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
            if (!theChat)
                return res_1.failure(res, 'no chat');
            if (!theChat.type === constants.chat_types.tribe)
                return res_1.failure(res, 'not a tribe');
            const encryptedForMeText = rsa.encrypt(owner.contactKey, text);
            const encryptedText = rsa.encrypt(theChat.groupKey, text);
            const textMap = { 'chat': encryptedText };
            var date = new Date();
            date.setMilliseconds(0);
            const msg = {
                chatId: theChat.id,
                uuid: short.generate(),
                type: constants.message_types.message,
                sender: owner.id,
                amount: amount || 0,
                date: date,
                messageContent: encryptedForMeText,
                remoteMessageContent: JSON.stringify(textMap),
                status: constants.statuses.confirmed,
                createdAt: date,
                updatedAt: date,
            };
            const message = yield models_1.models.Message.create(msg);
            network.sendMessage({
                chat: theChat,
                sender: owner,
                message: { content: textMap, id: message.id, uuid: message.uuid },
                type: constants.message_types.message,
            });
        }
        else {
            return res_1.failure(res, 'no action');
        }
    });
}
//# sourceMappingURL=actions.js.map