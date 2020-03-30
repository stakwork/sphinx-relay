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
const lock_1 = require("../utils/lock");
const models_1 = require("../models");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const helpers = require("../helpers");
const constants = require(__dirname + '/../../config/constants.json');
function sendConfirmation({ chat, sender, msg_id }) {
    helpers.sendMessage({
        chat,
        sender,
        message: { id: msg_id },
        type: constants.message_types.confirmation,
    });
}
exports.sendConfirmation = sendConfirmation;
function receiveConfirmation(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('received confirmation', { payload });
        const dat = payload.content || payload;
        const chat_uuid = dat.chat.uuid;
        const msg_id = dat.message.id;
        const sender_pub_key = dat.sender.pub_key;
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key } });
        const chat = yield models_1.models.Chat.findOne({ where: { uuid: chat_uuid } });
        // new confirmation logic
        if (msg_id) {
            lock_1.default.acquire('confirmation', function (done) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("update status map");
                    const message = yield models_1.models.Message.findOne({ where: { id: msg_id } });
                    if (message) {
                        let statusMap = {};
                        try {
                            statusMap = JSON.parse(message.statusMap || '{}');
                        }
                        catch (e) { }
                        statusMap[sender.id] = constants.statuses.received;
                        yield message.update({
                            status: constants.statuses.received,
                            statusMap: JSON.stringify(statusMap)
                        });
                        socket.sendJson({
                            type: 'confirmation',
                            response: jsonUtils.messageToJson(message, chat, sender)
                        });
                    }
                    done();
                });
            });
        }
        else { // old logic
            const messages = yield models_1.models.Message.findAll({
                limit: 1,
                where: {
                    chatId: chat.id,
                    sender: owner.id,
                    type: [
                        constants.message_types.message,
                        constants.message_types.invoice,
                        constants.message_types.attachment,
                    ],
                    status: constants.statuses.pending,
                },
                order: [['createdAt', 'desc']]
            });
            const message = messages[0];
            message.update({ status: constants.statuses.received });
            socket.sendJson({
                type: 'confirmation',
                response: jsonUtils.messageToJson(message, chat, sender)
            });
        }
    });
}
exports.receiveConfirmation = receiveConfirmation;
//# sourceMappingURL=confirmations.js.map