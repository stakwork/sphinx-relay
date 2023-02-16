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
exports.init = void 0;
const Sphinx = require("sphinx-bot");
const logger_1 = require("../utils/logger");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const constants_1 = require("../constants");
const block_1 = require("./utill/block");
const hideAndUnhideCommand_1 = require("../controllers/botapi/hideAndUnhideCommand");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const botPrefix = '/block';
function init() {
    if (initted)
        return;
    initted = true;
    //   const commands = ['hide', 'add', 'remove']
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot) !== botPrefix)
            return;
        const isGroupJoin = message.type === constants_1.default.message_types.group_join;
        const arr = (message.content && message.content.split(' ')) || [];
        if (arr[0] !== botPrefix && !isGroupJoin)
            return;
        // const cmd = arr[1]
        const tribe = (yield models_1.models.Chat.findOne({
            where: { uuid: message.channel.id },
        }));
        if (isGroupJoin) {
            try {
                const contactJoining = (yield models_1.models.Contact.findOne({
                    where: { id: message.member.id, tenant: tribe.tenant },
                }));
                const bot = (yield models_1.models.ChatBot.findOne({
                    where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
                }));
                const owner = (yield models_1.models.Contact.findOne({
                    where: { id: tribe.tenant, isOwner: true, tenant: tribe.tenant },
                }));
                const blocked = JSON.parse(bot.meta || '[]');
                if (blocked.includes(contactJoining.publicKey)) {
                    yield (0, block_1.kickChatMember)({
                        tribe,
                        contactId: contactJoining.id,
                        tenant: tribe.tenant,
                        owner,
                    });
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('BlockBot')
                        .setDescription(`${contactJoining.alias} was blocked from joining your tribe`)
                        .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, 'add', tribe.id));
                    message.channel.send({ embed });
                    return;
                }
                return;
            }
            catch (error) {
                logger_1.sphinxLogger.error(`WELCOME BOT ERROR ${error}`, logger_1.logging.Bots);
                return;
            }
        }
        if (arr[0] === botPrefix) {
            const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
            if (!isAdmin)
                return;
        }
    }));
}
exports.init = init;
//# sourceMappingURL=block.js.map