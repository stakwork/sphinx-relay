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
        const cmd = arr[1];
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
            switch (cmd) {
                case 'add':
                    const pubkey = arr[2];
                    if (pubkey.length !== 66) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('BlockBot')
                            .setDescription(`Invalid Public key`)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed });
                        return;
                    }
                    const contact = (yield models_1.models.Contact.findOne({
                        where: { publicKey: pubkey, tenant: tribe.tenant },
                    }));
                    if (contact) {
                        const isChatMember = (yield models_1.models.ChatMember.findOne({
                            where: {
                                chatId: tribe.id,
                                tenant: tribe.tenant,
                                contactId: contact.id,
                            },
                        }));
                        if (isChatMember) {
                            const owner = (yield models_1.models.Contact.findOne({
                                where: {
                                    id: tribe.tenant,
                                    isOwner: true,
                                    tenant: tribe.tenant,
                                },
                            }));
                            yield (0, block_1.kickChatMember)({
                                tribe,
                                contactId: contact.id,
                                tenant: tribe.tenant,
                                owner: owner,
                            });
                            yield (0, block_1.addToBlockedList)({ tribe, botPrefix, pubkey });
                            const embed = new Sphinx.MessageEmbed()
                                .setAuthor('BlockBot')
                                .setDescription(`You've successfully kicked the user out of this tribe and added user to the blocked list`)
                                .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                            message.channel.send({ embed });
                            return;
                        }
                    }
                    yield (0, block_1.addToBlockedList)({ tribe, botPrefix, pubkey });
                    const resEmbed = new Sphinx.MessageEmbed()
                        .setAuthor('BlockBot')
                        .setDescription(`You've successfully added this user to the blocked list`);
                    message.channel.send({ embed: resEmbed });
                    return;
                case 'remove':
                    const remove_pubkey = arr[2];
                    if (remove_pubkey.length !== 66) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('BlockBot')
                            .setDescription(`Invalid Public key`)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed });
                        return;
                    }
                    const msg = yield (0, block_1.removeFromBlockedList)({
                        tribe,
                        botPrefix,
                        pubkey: remove_pubkey,
                    });
                    const newResEmbed = new Sphinx.MessageEmbed()
                        .setAuthor('BlockBot')
                        .setDescription(msg);
                    message.channel.send({ embed: newResEmbed });
                    return;
                default:
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('BlockBot')
                        .setTitle('Bot Commands:')
                        .addFields([
                        {
                            name: 'Add User Pubkey to block',
                            value: '/block add ${public_key}',
                        },
                        {
                            name: 'Remove User Pubkey from block list',
                            value: '/block remove ${public_key}',
                        },
                        { name: 'Help', value: '/welcome help' },
                    ])
                        .setThumbnail(botSVG);
                    message.channel.send({ embed });
                    return;
            }
        }
    }));
}
exports.init = init;
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
//# sourceMappingURL=block.js.map