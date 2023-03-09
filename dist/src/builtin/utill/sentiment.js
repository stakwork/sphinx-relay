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
exports.updateUrl = exports.checkThreshold = exports.timerMs = exports.timer = exports.threshold = exports.botResponse = void 0;
const Sphinx = require("sphinx-bot");
const hideAndUnhideCommand_1 = require("../../controllers/botapi/hideAndUnhideCommand");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const node_fetch_1 = require("node-fetch");
function botResponse(botName, message, botPrefix, tribeId, botMessage, command) {
    return __awaiter(this, void 0, void 0, function* () {
        const embed = new Sphinx.MessageEmbed()
            .setAuthor(botName)
            .setDescription(message)
            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, command, tribeId));
        botMessage.channel.send({ embed });
    });
}
exports.botResponse = botResponse;
function threshold(botName, command, tribe, botPrefix, message, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const threshold = Number(value);
        if (isNaN(threshold)) {
            return yield botResponse(botName, 'Invalid threshold value', botPrefix, tribe.id, message, command);
        }
        try {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            if (!bot) {
                logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR, BOT NOT FOUND`, logger_1.logging.Bots]);
            }
            let meta = JSON.parse(bot.meta || `{}`);
            meta.threshold = threshold;
            yield bot.update({ meta: JSON.stringify(meta) });
            return yield botResponse(botName, 'Threshold updated successfully', botPrefix, tribe.id, message, command);
        }
        catch (error) {
            logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logger_1.logging.Bots]);
            return yield botResponse(botName, 'Error updating threshold', botPrefix, tribe.id, message, command);
        }
    });
}
exports.threshold = threshold;
function timer(botName, command, tribe, botPrefix, message, value, interval) {
    return __awaiter(this, void 0, void 0, function* () {
        const timer = Number(value);
        if (isNaN(timer)) {
            yield botResponse(botName, 'Invalid timer value', botPrefix, tribe.id, message, command);
        }
        try {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            let meta = JSON.parse(bot.meta || `{}`);
            meta.timer = timer;
            yield bot.update({ meta: JSON.stringify(meta) });
            clearInterval(interval);
            interval = setInterval(() => {
                checkThreshold(tribe, botName, botPrefix, interval, command, message);
            }, timerMs(timer));
            botResponse(botName, 'Timer was updated successfully', botPrefix, tribe.id, message, command);
        }
        catch (error) {
            logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logger_1.logging.Bots]);
        }
    });
}
exports.timer = timer;
function timerMs(mins) {
    return mins * 60 * 1000;
}
exports.timerMs = timerMs;
function checkThreshold(tribe, botName, botPrefix, interval, command, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            if (!bot) {
                clearInterval(interval);
            }
            let meta = JSON.parse(bot.meta || `{}`);
            const url = meta.url;
            console.log('+++++++++++++ SENTIMENT META', meta);
            if (url) {
                const sentiment = yield getSentiment(url);
                console.log('++++++++++++ Sendtiment', sentiment);
                const newThreshold = sentiment === null || sentiment === void 0 ? void 0 : sentiment.reduce((total, value) => total + value.sentiment_score, 0);
                if (typeof newThreshold === 'number') {
                    const last_result = (meta === null || meta === void 0 ? void 0 : meta.last_result) || 0;
                    const threshold = (meta === null || meta === void 0 ? void 0 : meta.threshold) || 10;
                    console.log('++++++++++ threshold', threshold);
                    const diff = newThreshold - last_result;
                    console.log('++++++++++ difference', diff);
                    console.log('+++++++++ last result', last_result);
                    if (diff >= (last_result * threshold) / 100 &&
                        (diff !== 0 || last_result * threshold !== 0)) {
                        // Send Alert to tribe
                        botResponse(botName, 'Sentiment has increased by some percentage', botPrefix, tribe.id, message, command || 'threshold');
                    }
                    yield bot.update({
                        meta: JSON.stringify(Object.assign(Object.assign({}, meta), { last_result: newThreshold })),
                    });
                }
                console.log('++++++++++ THRESHOLD FROM ENDPOINT', newThreshold);
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logger_1.logging.Bots]);
        }
    });
}
exports.checkThreshold = checkThreshold;
function getSentiment(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to get sentiment ' + r.status;
            }
            // const res = await r.json()
            //   return res
            const res = {
                data: [
                    {
                        date_added_to_graph: '1678216636.390903',
                        sentiment_score: 2,
                    },
                    {
                        date_added_to_graph: '1678214894.6002529',
                        sentiment_score: 2,
                    },
                    {
                        date_added_to_graph: '1678214837.070613',
                        sentiment_score: 9,
                    },
                    {
                        date_added_to_graph: '1678142973.310696',
                        sentiment_score: 9,
                    },
                    {
                        date_added_to_graph: '1678142948.614592',
                        sentiment_score: 8,
                    },
                    {
                        date_added_to_graph: '1678142931.287526',
                        sentiment_score: 7,
                    },
                    {
                        date_added_to_graph: '1678142921.061992',
                        sentiment_score: 6,
                    },
                    {
                        date_added_to_graph: '1678142909.395699',
                        sentiment_score: 5,
                    },
                    {
                        date_added_to_graph: '1678142894.856799',
                        sentiment_score: 3,
                    },
                    {
                        date_added_to_graph: '1678142888.8225641',
                        sentiment_score: 3,
                    },
                    {
                        date_added_to_graph: '1678142877.288387',
                        sentiment_score: 2,
                    },
                    {
                        date_added_to_graph: '1678142867.893755',
                        sentiment_score: 1,
                    },
                    {
                        date_added_to_graph: '1678140944.6455538',
                        sentiment_score: 3,
                    },
                ],
            };
            return (res === null || res === void 0 ? void 0 : res.data) || [];
        }
        catch (error) {
            throw error;
        }
    });
}
function updateUrl(botPrefix, botName, url, tribe, command, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!url) {
            return yield botResponse(botName, 'Please provide Valid URL', botPrefix, tribe.id, message, command);
        }
        try {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            if (!bot) {
                logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR, BOT NOT FOUND`, logger_1.logging.Bots]);
            }
            let meta = JSON.parse(bot.meta || `{}`);
            meta.url = url;
            yield bot.update({ meta: JSON.stringify(meta) });
            return yield botResponse(botName, 'sentiment Url updated Successfully', botPrefix, tribe.id, message, command);
        }
        catch (error) {
            logger_1.sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logger_1.logging.Bots]);
        }
    });
}
exports.updateUrl = updateUrl;
//# sourceMappingURL=sentiment.js.map