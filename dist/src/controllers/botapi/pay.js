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
const jsonUtils = require("../../utils/json");
const socket = require("../../utils/socket");
const constants_1 = require("../../constants");
const tribes_1 = require("../../utils/tribes");
const logger_1 = require("../../utils/logger");
function pay(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, bot_name, chat_uuid, msg_uuid, reply_uuid, recipient_id, parent_id, } = a;
        logger_1.sphinxLogger.info(`=> BOT PAY ${JSON.stringify(a, null, 2)}`);
        if (!recipient_id)
            return logger_1.sphinxLogger.error(`no recipient_id`);
        if (!chat_uuid)
            return logger_1.sphinxLogger.error(`no chat_uuid`);
        const theChat = yield (0, tribes_1.getTribeOwnersChatByUUID)(chat_uuid);
        if (!(theChat && theChat.id))
            return logger_1.sphinxLogger.error(`no chat`);
        if (theChat.type !== constants_1.default.chat_types.tribe)
            return logger_1.sphinxLogger.error(`not a tribe`);
        const owner = (yield models_1.models.Contact.findOne({
            where: { id: theChat.tenant },
        }));
        const tenant = owner.id;
        const alias = bot_name || owner.alias;
        const botContactId = -1;
        const date = new Date();
        date.setMilliseconds(0);
        const msg = {
            chatId: theChat.id,
            uuid: msg_uuid || short.generate(),
            type: constants_1.default.message_types.boost,
            sender: botContactId,
            amount: amount || 0,
            date: date,
            status: constants_1.default.statuses.confirmed,
            replyUuid: reply_uuid || '',
            createdAt: date,
            updatedAt: date,
            senderAlias: alias,
            tenant,
        };
        if (parent_id)
            msg.parentId = parent_id;
        const message = (yield models_1.models.Message.create(msg));
        socket.sendJson({
            type: 'boost',
            response: jsonUtils.messageToJson(message, theChat, owner),
        }, tenant);
        yield network.sendMessage({
            chat: theChat,
            sender: Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId, role: constants_1.default.chat_roles.owner }),
            message: {
                content: '',
                amount: message.amount,
                id: message.id,
                uuid: message.uuid,
                replyUuid: message.replyUuid,
                parentId: message.parentId || 0,
            },
            type: constants_1.default.message_types.boost,
            success: () => ({ success: true }),
            failure: (e) => {
                return logger_1.sphinxLogger.error(e);
            },
            isForwarded: true,
            realSatsContactId: recipient_id,
        });
    });
}
exports.default = pay;
//# sourceMappingURL=pay.js.map