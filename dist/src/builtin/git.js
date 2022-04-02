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
exports.getOrCreateGitBot = exports.updateGitBotPat = exports.patToBotWebhookField = exports.botWebhookFieldToPat = exports.init = exports.GITBOT_PIC = exports.GITBOT_UUID = void 0;
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const octokit_1 = require("octokit");
const models_1 = require("../models");
const constants_1 = require("../constants");
const tribes_1 = require("../utils/tribes");
// import { sphinxLogger } from '../utils/logger'
const crypto = require("crypto");
const connect_1 = require("../utils/connect");
const githook_1 = require("../utils/githook");
const logger_1 = require("../utils/logger");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const prefix = '/git';
exports.GITBOT_UUID = '_gitbot';
exports.GITBOT_PIC = 'https://stakwork-assets.s3.amazonaws.com/github-logo.png';
function octokit(pat) {
    const octokit = new octokit_1.Octokit({ auth: pat });
    return octokit;
}
function getStuff(message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chat = yield (0, tribes_1.getTribeOwnersChatByUUID)(message.channel.id);
            // console.log("=> WelcomeBot chat", chat);
            if (!(chat && chat.id))
                throw new Error('chat not found');
            const chatBot = yield models_1.models.ChatBot.findOne({
                where: {
                    chatId: chat.id,
                    botPrefix: '/git',
                    botType: constants_1.default.bot_types.builtin,
                    tenant: chat.tenant,
                },
            });
            if (!chatBot)
                throw new Error('chat bot not found');
            const empty = { repos: [] };
            const meta = chatBot.meta ? JSON.parse(chatBot.meta) : empty;
            return { chat, chatBot, meta };
        }
        catch (_e) {
            throw new Error('failed');
        }
    });
}
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        const words = (message.content && message.content.split(' ')) || [];
        if (words[0] !== prefix)
            return;
        const cmd = words[1];
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        if (!isAdmin)
            return;
        switch (cmd) {
            case 'pay':
                console.log('pay user');
                return;
            case 'add':
                // console.log('add')
                try {
                    const { meta, chat, chatBot } = yield getStuff(message);
                    // if (!meta.pat) throw new Error('GitBot not connected')
                    const repo = from_repo_url(words[2]);
                    logger_1.sphinxLogger.info('==> repo: ' + repo);
                    const bot = yield getOrCreateGitBot(chat.tenant);
                    const pat = yield getPat(chat.tenant);
                    yield addWebhookToRepo(pat, repo, bot.secret);
                    meta.repos.push({ path: repo });
                    yield chatBot.update({ meta: JSON.stringify(meta) });
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('GitBot')
                        .setDescription(repo + ' repo has been added!');
                    return message.channel.send({ embed });
                }
                catch (e) {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('GitBot')
                        .setDescription('Error: ' + e.message);
                    return message.channel.send({ embed });
                }
            case 'remove':
                // console.log('remove')
                try {
                    const stuff = yield getStuff(message);
                    // if (!meta.pat) throw new Error('GitBot not connected')
                    const repo = from_repo_url(words[2]);
                    const repos = stuff.meta.repos.filter((r) => r.path !== repo);
                    yield stuff.chatBot.update({
                        meta: JSON.stringify(Object.assign(Object.assign({}, stuff.meta), { repos })),
                    });
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('GitBot')
                        .setDescription(repo + ' repo has been removed!');
                    return message.channel.send({ embed });
                }
                catch (e) {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('GitBot')
                        .setDescription('Error: ' + e.message);
                    return message.channel.send({ embed });
                }
            case 'list':
                // console.log('list')
                try {
                    const stuff = yield getStuff(message);
                    if (!stuff.meta.repos.length)
                        throw new Error('no repos!');
                    const embed3 = new Sphinx.MessageEmbed()
                        .setAuthor('MotherBot')
                        .setTitle('Bots:')
                        .addFields(stuff.meta.repos.map((b) => {
                        return { name: b.path, value: '' };
                    }));
                    message.channel.send({ embed: embed3 });
                }
                catch (e) {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('GitBot')
                        .setDescription('Error: ' + e.message);
                    return message.channel.send({ embed });
                }
        }
    }));
}
exports.init = init;
function getPat(tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield models_1.models.Bot.findOne({
            where: { uuid: exports.GITBOT_UUID, tenant },
        });
        if (existing) {
            return botWebhookFieldToPat(existing.webhook);
        }
        else
            throw new Error('no PAT in GitBot');
    });
}
function botWebhookFieldToPat(webhook) {
    if (!webhook.includes('|'))
        throw new Error('no PAT in gitBot webhook');
    const arr = webhook.split('|');
    if (arr.length < 2)
        throw new Error('no PAT in gitBot webhook');
    return arr[1];
}
exports.botWebhookFieldToPat = botWebhookFieldToPat;
function patToBotWebhookField(pat, gitbottype = 'github') {
    return `${gitbottype}|${pat}`;
}
exports.patToBotWebhookField = patToBotWebhookField;
function addWebhookToRepo(pat, repoAndOwner, bot_secret) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bot_secret) {
            throw new Error('no GitBot secret supplied');
        }
        const octo = octokit(pat);
        const arr = repoAndOwner.split('/');
        const owner = arr[0];
        const repo = arr[1];
        const list = yield octo.request('GET /repos/{owner}/{repo}/hooks', {
            owner,
            repo,
        });
        const url = (yield (0, connect_1.getIP)()) + '/webhook';
        if (list.data.length) {
            const existing = list.data.find((d) => d.config.url === url);
            if (existing)
                return;
        }
        yield octo.request('POST /repos/{owner}/{repo}/hooks', {
            owner,
            repo,
            active: true,
            events: githook_1.all_webhook_events,
            config: {
                url: url,
                content_type: 'json',
                secret: bot_secret,
            },
        });
    });
}
// const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
//   <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
// </svg>`
function from_repo_url(s) {
    const parts = s.split('/');
    if (parts.length != 2)
        throw new Error('invalid repo');
    return s;
}
function updateGitBotPat(tenant, pat) {
    return __awaiter(this, void 0, void 0, function* () {
        const gitBot = yield getOrCreateGitBot(tenant);
        yield gitBot.update({ webhook: patToBotWebhookField(pat, 'github') });
    });
}
exports.updateGitBotPat = updateGitBotPat;
function getOrCreateGitBot(tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield models_1.models.Bot.findOne({
            where: { uuid: exports.GITBOT_UUID, tenant },
        });
        if (existing) {
            return existing;
        }
        const newBot = {
            id: crypto.randomBytes(10).toString('hex').toLowerCase(),
            name: 'GitBot',
            uuid: exports.GITBOT_UUID,
            secret: crypto.randomBytes(20).toString('hex').toLowerCase(),
            pricePerUse: 0,
            tenant,
        };
        const b = yield models_1.models.Bot.create(newBot);
        return b;
    });
}
exports.getOrCreateGitBot = getOrCreateGitBot;
//# sourceMappingURL=git.js.map