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
// import { sphinxLogger, logging } from '../utils/logger'
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const sentiment_1 = require("./utill/sentiment");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const botPrefix = '/sentiment';
const botName = 'SentimentBot';
let interval;
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        // if (
        //   message.author?.bot !== botPrefix &&
        //   message.content !== '/bot install sentiment'
        // )
        //   return
        const arr = (message.content && message.content.split(' ')) || [];
        const tribe = (yield models_1.models.Chat.findOne({
            where: { uuid: message.channel.id },
        }));
        console.log('+++++++++++++ Interval', interval);
        if (!interval) {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            let meta = JSON.parse(bot.meta || `{}`);
            interval = setInterval(() => {
                (0, sentiment_1.checkThreshold)(tribe, botName, botPrefix, interval, 'threshold', message);
            }, (0, sentiment_1.timerMs)(meta.timer || 60));
        }
        console.log('++++++++++++ Interval 2', interval);
        if (arr[0] === botPrefix) {
            const cmd = arr[1];
            switch (cmd) {
                case 'threshold':
                    if (arr.length < 3)
                        return;
                    yield (0, sentiment_1.threshold)(botName, cmd, tribe, botPrefix, message, arr[2]);
                    return;
                case 'timer':
                    if (arr.length < 3)
                        return;
                    yield (0, sentiment_1.timer)(botName, cmd, tribe, botPrefix, message, arr[2], interval);
                    return;
                case 'url':
                    if (arr.length < 3)
                        return;
                    yield (0, sentiment_1.updateUrl)(botPrefix, botName, arr[2], tribe, cmd, message);
                    return;
                default:
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor(botName)
                        .setTitle('Bot Commands:')
                        .addFields([
                        {
                            name: 'Configure timer',
                            value: '/sentiment timer ${intervals when sentiments will be gotten in minutes}',
                        },
                        {
                            name: 'Configure Threshold',
                            value: '/sentiment threshold ${threshold you will like to check against}',
                        },
                        {
                            name: 'Configure Url',
                            value: '/sentiment url ${sentiment_url}',
                        },
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
//# sourceMappingURL=sentiment.js.map