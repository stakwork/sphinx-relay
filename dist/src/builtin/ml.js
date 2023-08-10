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
exports.sleep = exports.init = exports.CALLBACKS = exports.ML_BOTNAME = exports.ML_PREFIX = void 0;
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const utill_1 = require("./utill");
const config_1 = require("../utils/config");
const node_fetch_1 = require("node-fetch");
const ml_1 = require("./utill/ml");
const config = (0, config_1.loadConfig)();
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
exports.ML_PREFIX = '/ml';
exports.ML_BOTNAME = `${exports.ML_PREFIX.substring(1, 2).toUpperCase()}${exports.ML_PREFIX.substring(2)}Bot`;
exports.CALLBACKS = {};
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot) !== exports.ML_PREFIX)
            return;
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            const bot = yield (0, utill_1.findBot)({ botPrefix: exports.ML_PREFIX, tribe });
            let meta = JSON.parse(bot.meta || `{}`);
            meta.kind = meta.kind || 'text';
            const url = meta.url;
            const api_key = meta.apiKey;
            const arr = (message.content && message.content.split(' ')) || [];
            if (isAdmin && arr[0] === exports.ML_PREFIX) {
                const cmd = arr[1];
                switch (cmd) {
                    case 'url':
                        const newUrl = arr[2];
                        yield (0, ml_1.addUrl)(bot, meta, exports.ML_BOTNAME, exports.ML_PREFIX, tribe, cmd, message, newUrl);
                        return;
                    case 'api_key':
                        const newApiKey = arr[2];
                        yield (0, ml_1.addApiKey)(bot, meta, exports.ML_BOTNAME, exports.ML_PREFIX, tribe, cmd, message, newApiKey);
                        return;
                    case 'kind':
                        const newKind = arr[2];
                        if (newKind !== 'text' && newKind !== 'image') {
                            yield (0, utill_1.botResponse)(exports.ML_BOTNAME, 'Please provide a valid kind (text/image)', exports.ML_PREFIX, tribe.id, message, cmd);
                            return;
                        }
                        meta.kind = newKind;
                        yield bot.update({ meta: JSON.stringify(meta) });
                        yield (0, utill_1.botResponse)(exports.ML_BOTNAME, `bot kind updated to ${newKind}`, exports.ML_PREFIX, tribe.id, message, cmd);
                        return;
                    default:
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor(exports.ML_BOTNAME)
                            .setTitle('Bot Commands:')
                            .addFields([
                            {
                                name: `Add URL to ${exports.ML_BOTNAME}`,
                                value: `${exports.ML_PREFIX} url {URL}`,
                            },
                            {
                                name: `Add API_KEY to ${exports.ML_BOTNAME}`,
                                value: `${exports.ML_PREFIX} url {API_KEY}`,
                            },
                            {
                                name: `Set content type`,
                                value: `${exports.ML_PREFIX} kind {text/image}`,
                            },
                        ])
                            .setOnlyOwner(true);
                        message.channel.send({ embed });
                        return;
                }
            }
            if (!url || !api_key) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor(exports.ML_BOTNAME)
                    .setDescription('not configured!')
                    .setOnlyUser(parseInt(message.member.id || '0'));
                message.channel.send({ embed });
                return;
            }
            let host_name = config.host_name;
            if (!host_name.startsWith('http')) {
                host_name = `https://${host_name}`;
            }
            console.log('ml bot hostname', host_name);
            const r = yield (0, node_fetch_1.default)(url, {
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
            console.log('ML body j', j);
            if (!j.body) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setDescription('failed to process message (no body)')
                    .setOnlyUser(parseInt(message.member.id || '0'));
                message.channel.send({ embed });
                return;
            }
            let process_id = j.body && j.body.process_id;
            if (!process_id) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setDescription('failed to process message')
                    .setOnlyUser(parseInt(message.member.id || '0'));
                message.channel.send({ embed });
                return;
            }
            console.log('PROCESS ID!!!', process_id);
            exports.CALLBACKS[process_id] = function (msg) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('ML Bot')
                    .setOnlyUser(parseInt(message.member.id || '0'));
                if (meta.kind === 'text') {
                    embed.setDescription(msg);
                }
                if (meta.kind === 'image') {
                    embed.setImage(msg);
                }
                message.channel.send({ embed });
                delete exports.CALLBACKS[process_id];
            };
            setTimeout(() => {
                delete exports.CALLBACKS[process_id];
            }, 5 * 60 * 1000);
        }
        catch (e) {
            console.error('ML CALL FAILED', e);
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