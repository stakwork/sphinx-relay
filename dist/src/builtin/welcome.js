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
const Sphinx = require("sphinx-bot");
const api_1 = require("../controllers/api");
const models_1 = require("../models");
const constants_1 = require("../constants");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', api_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        const arr = (message.content && message.content.split(' ')) || [];
        console.log('message.type', message.type);
        const isGroupJoin = message.type === constants_1.default.message_types.group_join;
        console.log('isGroupJoin', isGroupJoin);
        if (arr.length < 2 && !isGroupJoin)
            return;
        if (arr[0] !== '/welcome' && !isGroupJoin)
            return;
        const cmd = arr[1];
        if (isGroupJoin) {
            try {
                const chat = yield models_1.models.Chat.findOne({ where: { uuid: message.channel.id } });
                if (!chat)
                    return;
                const chatBot = yield models_1.models.ChatBot.findOne({
                    where: {
                        chatId: chat.id, botPrefix: '/welcome', botType: constants_1.default.bot_types.builtin
                    }
                });
                let meta = 'Welcome to the tribe!';
                if (chatBot && chatBot.meta) {
                    meta = chatBot.meta;
                }
                console.log("=> WELCOMEMETA", meta);
                const resEmbed = new Sphinx.MessageEmbed()
                    .setAuthor('WelcomeBot')
                    .setDescription(meta);
                message.channel.send({ embed: resEmbed });
                return;
            }
            catch (e) {
                console.log("WELCOME BOT ERROR", e);
            }
        }
        const isAdmin = message.member.roles.find(role => role.name === 'Admin');
        if (!isAdmin)
            return;
        switch (cmd) {
            case 'setmessage':
                if (arr.length < 3)
                    return;
                console.log("setmsg", arr[2]);
                const chat = yield models_1.models.Chat.findOne({ where: { uuid: message.channel.id } });
                if (!chat)
                    return;
                const chatBot = yield models_1.models.ChatBot.findOne({
                    where: {
                        chatId: chat.id, botPrefix: '/welcome', botType: constants_1.default.bot_types.builtin
                    }
                });
                if (!chatBot)
                    return;
                const meta = arr.slice(2, arr.length).join(' ');
                yield chatBot.update({ meta });
                const resEmbed = new Sphinx.MessageEmbed()
                    .setAuthor('WelcomeBot')
                    .setDescription('Your welcome message has been updated');
                message.channel.send({ embed: resEmbed });
                return;
            default:
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('WelcomeBot')
                    .setTitle('Bot Commands:')
                    .addFields([
                    { name: 'Set welcome message', value: '/welcome setmessage {MESSAGE}' },
                    { name: 'Help', value: '/welcome help' }
                ])
                    .setThumbnail(botSVG);
                message.channel.send({ embed });
                return;
        }
    }));
}
exports.init = init;
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
//# sourceMappingURL=welcome.js.map