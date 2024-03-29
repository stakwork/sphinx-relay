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
exports.checkAdminOnlyMessage = exports.sendMessageToJarvis = exports.updateLink = void 0;
const _1 = require("./");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const constants_1 = require("../../constants");
const node_fetch_1 = require("node-fetch");
function updateLink({ botPrefix, command, botMessage, tribe, url, isAdmin, botName, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bot = yield (0, _1.findBot)({ botPrefix, tribe });
            let meta = JSON.parse(bot.meta || `{}`);
            meta.url = url;
            yield bot.update({ meta: JSON.stringify(meta) });
            sendMessageToJarvis({ isAdmin, message: botMessage, tribe, botPrefix });
            return yield (0, _1.botResponse)(botName, 'Jarvis link updated successfully', botPrefix, tribe.id, botMessage, command);
        }
        catch (error) {
            logger_1.sphinxLogger.error([`JARVIS BOT ERROR ${error}`, logger_1.logging.Bots]);
            return yield (0, _1.botResponse)(botName, 'Error updating link', botPrefix, tribe.id, botMessage, command);
        }
    });
}
exports.updateLink = updateLink;
function sendMessageToJarvis({ isAdmin, message, tribe, botPrefix, }) {
    return __awaiter(this, void 0, void 0, function* () {
        let isAdminOnlyMessage = false;
        if (isAdmin) {
            isAdminOnlyMessage = yield checkAdminOnlyMessage({ tribe, message });
        }
        if (!isAdminOnlyMessage) {
            try {
                const savedMessage = (yield models_1.models.Message.findOne({
                    where: { uuid: message.id, tenant: tribe.tenant },
                }));
                const bot = yield (0, _1.findBot)({ botPrefix, tribe });
                let meta = JSON.parse(bot.meta || `{}`);
                const parsedJarvisMsg = parseMessage(savedMessage);
                let jarvisMsg;
                if (savedMessage.type === constants_1.default.message_types.attachment) {
                    jarvisMsg = Object.assign(Object.assign({}, parsedJarvisMsg), { media_key: message.media_key, message_content: message.content });
                }
                else {
                    jarvisMsg = Object.assign(Object.assign({}, parsedJarvisMsg), { message_content: message.content });
                }
                //Make Api call to Javis
                if (meta === null || meta === void 0 ? void 0 : meta.url) {
                    const res = yield (0, node_fetch_1.default)(meta.url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(jarvisMsg),
                    });
                    if (!res.ok) {
                        logger_1.sphinxLogger.error([
                            `JARVIS BOT ERROR WHILE SENDING TO JARVIS BACKEND ${res}`,
                            logger_1.logging.Bots,
                        ]);
                    }
                }
            }
            catch (error) {
                logger_1.sphinxLogger.error([
                    `JARVIS BOT ERROR WHILE SENDING TO JARVIS BACKEND ${error}`,
                    logger_1.logging.Bots,
                ]);
            }
        }
        return;
    });
}
exports.sendMessageToJarvis = sendMessageToJarvis;
function checkAdminOnlyMessage({ tribe, message, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (message.type !== constants_1.default.message_types.message || !message.content) {
                return false;
            }
            const arr = message.content.split(' ');
            const botPrefix = arr[0];
            const command = arr[1];
            const bots = (yield models_1.models.ChatBot.findAll({
                where: { chatId: tribe.id, tenant: tribe.tenant },
            }));
            for (let i = 0; i < bots.length; i++) {
                const bot = bots[i];
                if (bot.botPrefix === botPrefix) {
                    const commands = JSON.parse(bot.hiddenCommands || '[]');
                    if (commands.includes(command))
                        return true;
                }
            }
            return false;
        }
        catch (error) {
            logger_1.sphinxLogger.error([
                `JARVIS BOT ERROR WHILE GETTING IF ITS A HIDDEN COMMAND ${error}`,
                logger_1.logging.Bots,
            ]);
            return false;
        }
    });
}
exports.checkAdminOnlyMessage = checkAdminOnlyMessage;
function parseMessage(message) {
    return {
        amount: message.amount,
        amount_msat: message.amountMsat,
        chat_id: message.chatId,
        created_at: message.createdAt,
        date: message.date,
        expiration_date: message.expirationDate,
        id: message.id,
        media_key: message.mediaKey,
        media_token: message.mediaToken,
        media_type: message.mediaType,
        message_content: message.messageContent,
        network_type: message.network_type,
        original_muid: message.originalMuid,
        parent_id: message.parentId,
        payment_hash: message.paymentHash,
        payment_request: message.paymentRequest,
        recipient_alias: message.recipientAlias,
        recipient_pic: message.recipientPic,
        reply_uuid: message.replyUuid,
        sender: message.sender,
        sender_alias: message.senderAlias,
        sender_pic: message.senderPic,
        status: message.status,
        type: message.type,
        updated_at: message.updatedAt,
        uuid: message.uuid,
    };
}
//# sourceMappingURL=jarvis.js.map