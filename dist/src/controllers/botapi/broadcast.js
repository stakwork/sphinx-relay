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
const network = require("../../network");
const models_1 = require("../../models");
const short = require("short-uuid");
const rsa = require("../../crypto/rsa");
const jsonUtils = require("../../utils/json");
const socket = require("../../utils/socket");
const constants_1 = require("../../constants");
const logger_1 = require("../../utils/logger");
const index_1 = require("./index");
function broadcast(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, content, bot_name, msg_uuid, reply_uuid, parent_id, bot_pic, } = a;
        logger_1.sphinxLogger.info(`=> BOT BROADCAST`);
        const ret = yield index_1.validateAction(a);
        if (!ret)
            return;
        const { chat, owner } = ret;
        const tenant = owner.id;
        const encryptedForMeText = rsa.encrypt(owner.contactKey, content || '');
        const encryptedText = rsa.encrypt(chat.groupKey, content || '');
        const textMap = { chat: encryptedText };
        const date = new Date();
        date.setMilliseconds(0);
        const alias = bot_name || 'Bot';
        const botContactId = -1;
        const msg = {
            chatId: chat.id,
            uuid: msg_uuid || short.generate(),
            type: constants_1.default.message_types.bot_res,
            sender: botContactId,
            amount: amount || 0,
            date: date,
            messageContent: encryptedForMeText,
            remoteMessageContent: JSON.stringify(textMap),
            status: constants_1.default.statuses.confirmed,
            replyUuid: reply_uuid || '',
            createdAt: date,
            updatedAt: date,
            senderAlias: alias,
            tenant,
        };
        if (parent_id)
            msg.parentId = parent_id;
        if (bot_pic)
            msg.senderPic = bot_pic;
        const message = (yield models_1.models.Message.create(msg));
        socket.sendJson({
            type: 'message',
            response: jsonUtils.messageToJson(message, chat, owner),
        }, tenant);
        // console.log("BOT BROADCASE MSG", owner.dataValues)
        // console.log('+++++++++> MSG TO BROADCAST', message.dataValues)
        yield network.sendMessage({
            chat: chat,
            sender: Object.assign(Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId, role: constants_1.default.chat_roles.reader }), (bot_pic && { photoUrl: bot_pic })),
            message: {
                content: textMap,
                id: message.id,
                uuid: message.uuid,
                replyUuid: message.replyUuid,
                parentId: message.parentId || 0,
            },
            type: constants_1.default.message_types.bot_res,
            success: () => ({ success: true }),
            failure: (e) => {
                return logger_1.sphinxLogger.error(e);
            },
            isForwarded: true,
        });
    });
}
exports.default = broadcast;
//# sourceMappingURL=broadcast.js.map