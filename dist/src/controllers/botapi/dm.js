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
const index_1 = require("./index");
const logger_1 = require("../../utils/logger");
const models_1 = require("../../models");
const md5 = require("md5");
const short = require("short-uuid");
const constants_1 = require("../../constants");
const network = require("../../network");
const rsa = require("../../crypto/rsa");
function dm(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, content, pubkey } = a;
        logger_1.sphinxLogger.info(`=> BOT DM ${JSON.stringify(a, null, 2)}`);
        const ret = yield (0, index_1.validateAction)(a);
        if (!ret)
            return;
        const owner = ret.owner;
        const tenant = owner.id;
        // const alias = bot_name || owner.alias
        if (!pubkey)
            return logger_1.sphinxLogger.error('bot DM no pubkey');
        if (pubkey.length !== 66)
            return logger_1.sphinxLogger.error('bot DM bad pubkey');
        const contact = (yield models_1.models.Contact.findOne({
            where: { publicKey: pubkey, tenant },
        }));
        if (!contact)
            return logger_1.sphinxLogger.error('bot DM no contact');
        const uuid = md5([owner.publicKey, pubkey].sort().join('-'));
        let chat = (yield models_1.models.Chat.findOne({
            where: { uuid },
        }));
        if (!chat) {
            // no chat! create new
            const date = new Date();
            date.setMilliseconds(0);
            logger_1.sphinxLogger.info(`=> no chat! create new`);
            chat = (yield models_1.models.Chat.create({
                uuid: uuid,
                contactIds: JSON.stringify([tenant, contact.id]),
                createdAt: date,
                updatedAt: date,
                type: constants_1.default.chat_types.conversation,
                tenant,
            }));
        }
        const encryptedContent = rsa.encrypt(contact.contactKey, content || '');
        yield network.sendMessage({
            chat: chat,
            sender: owner.dataValues,
            message: {
                content: encryptedContent,
                amount: amount || 0,
                uuid: short.generate(),
            },
            type: constants_1.default.message_types.message,
            success: () => ({ success: true }),
            failure: (e) => {
                return logger_1.sphinxLogger.error(e);
            },
        });
    });
}
exports.default = dm;
//# sourceMappingURL=dm.js.map