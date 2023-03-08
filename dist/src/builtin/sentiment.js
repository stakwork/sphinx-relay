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
        const arr = (message.content && message.content.split(' ')) || [];
        if (arr[0] !== botPrefix)
            return;
        const cmd = arr[1];
        const tribe = (yield models_1.models.Chat.findOne({
            where: { uuid: message.channel.id },
        }));
        switch (cmd) {
            case 'threshold':
                if (arr.length < 3)
                    return;
                yield (0, sentiment_1.threshold)(botName, cmd, tribe, botPrefix, message, arr[2]);
                return;
            case 'timer':
                if (arr.length < 3)
                    return;
        }
    }));
}
exports.init = init;
//# sourceMappingURL=sentiment.js.map