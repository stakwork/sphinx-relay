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
exports.sleep = exports.init = exports.CALLBACKS = exports.ML_PREFIX = void 0;
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const utill_1 = require("./utill");
const config_1 = require("../utils/config");
const config = (0, config_1.loadConfig)();
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
exports.ML_PREFIX = '/ml';
exports.CALLBACKS = {};
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        // if (message.author?.bot !== botPrefix) return
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            const bot = yield (0, utill_1.findBot)({ botPrefix: '/ML', tribe });
            let meta = JSON.parse(bot.meta || `{}`);
            const url = meta.url;
            if (!url) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setDescription('not configured')
                    .setOnlyOwner(isAdmin ? true : false);
                message.channel.send({ embed });
                return;
            }
            let host_name = config.host_name;
            if (!host_name.startsWith('http')) {
                host_name = `https://${host_name}`;
            }
            const r = yield fetch(`${url}/send-message-llm`, {
                method: 'POST',
                body: JSON.stringify({
                    message: message.content,
                    webhook: `${host_name}/ml`,
                }),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const j = yield r.json();
            if (!j.process_id) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setDescription('failed to process message')
                    .setOnlyOwner(isAdmin ? true : false);
                message.channel.send({ embed });
                return;
            }
            exports.CALLBACKS[j.process_id] = function (msg) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setDescription(msg)
                    .setOnlyOwner(isAdmin ? true : false);
                // .setOnlyUser(message.member.id)
                message.channel.send({ embed });
            };
            setTimeout(() => {
                delete exports.CALLBACKS[j.process_id];
            }, 5 * 60 * 1000);
        }
        catch (e) {
            console.error(e);
        }
    }));
}
exports.init = init;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
//# sourceMappingURL=ml.js.map