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
const short = require("short-uuid");
const network = require("../../network");
const models_1 = require("../../models");
const jsonUtils = require("../../utils/json");
const socket = require("../../utils/socket");
const constants_1 = require("../../constants");
const logger_1 = require("../../utils/logger");
const errMsgString_1 = require("../../utils/errMsgString");
const rsa = require("../../crypto/rsa");
const index_1 = require("./index");
function pay(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, bot_name, msg_uuid, reply_uuid, recipient_id, parent_id, content, recipient_pubkey, } = a;
        logger_1.sphinxLogger.info(`=> BOT PAY ${JSON.stringify(a, null, 2)}`);
        if (!recipient_id && !recipient_pubkey)
            return logger_1.sphinxLogger.error(`no recipient detail`);
        const ret = yield (0, index_1.validateAction)(a);
        if (!ret)
            return;
        const { chat, owner } = ret;
        const tenant = owner.id;
        const alias = bot_name || owner.alias;
        const botContactId = -1;
        const encryptedForMeText = rsa.encrypt(owner.contactKey, content || '');
        const encryptedText = rsa.encrypt(chat.groupKey, content || '');
        const textMap = { chat: encryptedText };
        let recipient_detail;
        if (recipient_pubkey) {
            try {
                const user = (yield models_1.models.Contact.findOne({
                    where: { tenant, publicKey: recipient_pubkey },
                }));
                if (!user) {
                    logger_1.sphinxLogger.error(`=> RECIPIENT PUBKEY DOES NOT EXIST IN ADMIN RECORD`, logger_1.logging.Bots);
                    return;
                }
                recipient_detail = user.id;
            }
            catch (error) {
                logger_1.sphinxLogger.error(`=> RECIPIENT PUBKEY ERROR ${error}`, logger_1.logging.Bots);
                return;
            }
        }
        else {
            recipient_detail = recipient_id;
        }
        const date = new Date();
        date.setMilliseconds(0);
        const msg = Object.assign({ chatId: chat.id, uuid: msg_uuid || short.generate(), type: reply_uuid
                ? constants_1.default.message_types.boost
                : constants_1.default.message_types.direct_payment, sender: botContactId, amount: amount || 0, date: date, status: constants_1.default.statuses.confirmed, replyUuid: reply_uuid || '', createdAt: date, updatedAt: date, senderAlias: alias, tenant }, (reply_uuid
            ? {}
            : {
                messageContent: encryptedForMeText,
                remoteMessageContent: JSON.stringify(textMap),
            }));
        if (parent_id)
            msg.parentId = parent_id;
        const message = (yield models_1.models.Message.create(msg));
        socket.sendJson({
            type: reply_uuid ? 'boost' : 'direct_payment',
            response: jsonUtils.messageToJson(message, chat, owner),
        }, tenant);
        yield network.sendMessage({
            chat: chat,
            sender: Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId, role: constants_1.default.chat_roles.owner }),
            message: {
                content: '',
                amount: message.amount,
                id: message.id,
                uuid: message.uuid,
                replyUuid: message.replyUuid,
                parentId: message.parentId || 0,
            },
            amount: amount || 0,
            type: reply_uuid
                ? constants_1.default.message_types.boost
                : constants_1.default.message_types.direct_payment,
            success: () => ({ success: true }),
            failure: (e) => __awaiter(this, void 0, void 0, function* () {
                const errorMsg = (0, errMsgString_1.errMsgString)(e);
                yield message.update({
                    errorMessage: errorMsg,
                    status: constants_1.default.statuses.failed,
                });
                return logger_1.sphinxLogger.error(e);
            }),
            isForwarded: true,
            realSatsContactId: recipient_detail,
        });
    });
}
exports.default = pay;
//# sourceMappingURL=pay.js.map