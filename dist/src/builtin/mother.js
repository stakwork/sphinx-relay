"use strict";
// @ts-nocheck
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
// import * as SphinxBot from '../../../sphinx-bot'
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const bots_1 = require("../controllers/bots");
const models_1 = require("../models");
const node_fetch_1 = require("node-fetch");
const constants_1 = require("../constants");
const config_1 = require("../utils/config");
const tribes_1 = require("../utils/tribes");
const logger_1 = require("../utils/logger");
const git_1 = require("./git");
const ml_1 = require("./ml");
const msg_types = Sphinx.MSG_TYPE;
const config = (0, config_1.loadConfig)();
const builtinBots = [
    'welcome',
    'loopout',
    'git',
    'badge',
    'callRecording',
    'kick',
    'sentiment',
    'jarvis',
    'spam_gone',
    ml_1.ML_PREFIX.substring(1),
];
// else just message type
const builtInBotMsgTypes = {
    welcome: [
        constants_1.default.message_types.message,
        constants_1.default.message_types.group_join,
    ],
    badge: [
        constants_1.default.message_types.message,
        constants_1.default.message_types.boost,
        constants_1.default.message_types.direct_payment,
    ],
    kick: [constants_1.default.message_types.group_join, constants_1.default.message_types.message],
    jarvis: [
        constants_1.default.message_types.message,
        constants_1.default.message_types.boost,
        constants_1.default.message_types.attachment,
    ],
    [`${ml_1.ML_PREFIX.substring(1)}`]: [
        constants_1.default.message_types.message,
        constants_1.default.message_types.attachment,
    ],
};
const builtInHiddenCmd = {
    callRecording: ['hide', 'update'],
    kick: ['hide', 'add', 'remove'],
    sentiment: ['threshold', 'timer', 'url'],
    jarvis: ['link', 'hide'],
    spam_gone: ['add', 'list', 'remove'],
    [`${ml_1.ML_PREFIX.substring(1)}`]: ['url', 'api_key', 'kind'],
};
const builtInBotNames = {
    welcome: 'WelcomeBot',
    loopout: 'LoopBot',
    git: 'GitBot',
    badge: 'BadgeBot',
    callRecording: 'CallRecordingBot',
    kick: 'KickBot',
    sentiment: 'SentimentBot',
    jarvis: 'JarvisBot',
    spam_gone: 'SpamGoneBot',
    [`${ml_1.ML_PREFIX.substring(1)}`]: ml_1.ML_BOTNAME,
};
function init() {
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        // console.log("MOTHERBOT GOT A MESSAGE", message);
        const arr = (message.content && message.content.split(' ')) || [];
        if (arr.length < 2)
            return;
        if (arr[0] !== '/bot')
            return;
        const cmd = arr[1];
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        if (!isAdmin)
            return;
        switch (cmd) {
            case 'install':
                if (arr.length < 3)
                    return;
                const botName = arr[2];
                if (builtinBots.includes(botName)) {
                    // localbot
                    logger_1.sphinxLogger.info(['MotherBot INSTALL', botName]);
                    const chat = yield (0, tribes_1.getTribeOwnersChatByUUID)(message.channel.id);
                    if (!(chat && chat.id))
                        return logger_1.sphinxLogger.error('=> motherbot no chat');
                    const existing = yield checkBotExist(chat, botName);
                    if (existing) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('MotherBot')
                            .setDescription(botName + ' already installed');
                        return message.channel.send({ embed });
                    }
                    const msgTypes = builtInBotMsgTypes[botName] || [
                        constants_1.default.message_types.message,
                    ];
                    const defaultHiddenCommands = builtInHiddenCmd[botName] || ['hide'];
                    const chatBot = {
                        chatId: chat.id,
                        botPrefix: '/' + botName,
                        botType: constants_1.default.bot_types.builtin,
                        msgTypes: JSON.stringify(msgTypes),
                        pricePerUse: 0,
                        tenant: chat.tenant,
                        hiddenCommands: JSON.stringify(defaultHiddenCommands),
                    };
                    if (botName === 'git') {
                        yield (0, git_1.getOrCreateGitBot)(chat.tenant);
                        chatBot.botUuid = git_1.GITBOT_UUID;
                    }
                    yield models_1.models.ChatBot.create(chatBot);
                    const theName = builtInBotNames[botName] || 'Bot';
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('MotherBot')
                        .setDescription(theName + ' has been installed!');
                    message.channel.send({ embed });
                }
                else {
                    const chat = yield (0, tribes_1.getTribeOwnersChatByUUID)(message.channel.id);
                    if (!(chat && chat.id))
                        return logger_1.sphinxLogger.error('=> motherbot no chat');
                    // check if bot already exist in tribe
                    const existing = yield checkBotExist(chat, botName);
                    if (existing) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('MotherBot')
                            .setDescription(botName + ' already installed');
                        return message.channel.send({ embed });
                    }
                    // bot from tribes registry
                    const bot = yield getBotByName(botName);
                    if (bot && bot.uuid) {
                        logger_1.sphinxLogger.info(['=> FOUND BOT', bot.unique_name]);
                        const chat = yield (0, tribes_1.getTribeOwnersChatByUUID)(message.channel.id);
                        if (!(chat && chat.id))
                            return logger_1.sphinxLogger.error('=> motherbot no chat');
                        (0, bots_1.installBotAsTribeAdmin)(chat, bot);
                    }
                    else {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('MotherBot')
                            .setDescription('No bot with that name');
                        message.channel.send({ embed });
                    }
                }
                return true;
            case 'uninstall':
                if (arr.length < 3)
                    return;
                const botName2 = arr[2];
                const chat2 = yield (0, tribes_1.getTribeOwnersChatByUUID)(message.channel.id);
                if (!(chat2 && chat2.id))
                    return logger_1.sphinxLogger.error('=> motherbot no chat');
                const existing2 = yield models_1.models.ChatBot.findOne({
                    where: {
                        chatId: chat2.id,
                        botPrefix: '/' + botName2,
                        tenant: chat2.tenant,
                    },
                });
                if (existing2) {
                    yield existing2.destroy();
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('MotherBot')
                        .setDescription(botName2 + ' has been removed');
                    return message.channel.send({ embed });
                }
                else {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('MotherBot')
                        .setDescription('Cant find a bot by that name');
                    return message.channel.send({ embed });
                }
            case 'search':
                if (arr.length < 2)
                    return;
                const query = arr[2];
                const bots = yield searchBots(query);
                if (bots.length === 0) {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('MotherBot')
                        .setDescription('No bots found');
                    return message.channel.send({ embed });
                }
                const embed3 = new Sphinx.MessageEmbed()
                    .setAuthor('MotherBot')
                    .setTitle('Bots:')
                    .addFields(bots.map((b) => {
                    const maxLength = 35;
                    const value = b.description.length > maxLength
                        ? b.description.substr(0, maxLength) + '...'
                        : b.description;
                    return { name: b.unique_name, value };
                }))
                    .setThumbnail(botSVG);
                message.channel.send({ embed: embed3 });
                return true;
            default:
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('MotherBot')
                    .setTitle('Bot Commands:')
                    .addFields([
                    { name: 'Search for bots', value: '/bot search {SEARCH_TERM}' },
                    { name: 'Install a new bot', value: '/bot install {BOTNAME}' },
                    { name: 'Uninstall a bot', value: '/bot uninstall {BOTNAME}' },
                    {
                        name: 'Hide bot command from tribe members',
                        value: '/{BOTNAME} hide {COMMAND_TO_HIDE}',
                    },
                    { name: 'Help', value: '/bot help' },
                ])
                    .setThumbnail(botSVG);
                message.channel.send({ embed });
        }
    }));
}
exports.init = init;
const botSVG = `<svg viewBox="64 64 896 896" height="16" width="16" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
function searchBots(q) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${config.tribes_host}/search/bots/${q}`);
            const j = yield r.json();
            return Array.isArray(j) ? j : [];
        }
        catch (e) {
            return [];
        }
    });
}
function getBotByName(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${config.tribes_host}/bot/${name}`);
            const j = yield r.json();
            if (j && j.uuid && j.owner_pubkey) {
                return j;
            }
            return null;
        }
        catch (e) {
            return null;
        }
    });
}
function checkBotExist(chat, botName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bot = yield models_1.models.ChatBot.findOne({
                where: {
                    chatId: chat.id,
                    botPrefix: '/' + botName,
                    tenant: chat.tenant,
                },
            });
            return bot;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error checking bot in tribe: ${error}`);
            throw error;
        }
    });
}
//# sourceMappingURL=mother.js.map