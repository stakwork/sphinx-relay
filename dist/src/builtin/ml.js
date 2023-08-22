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
exports.init = exports.CALLBACKS = exports.ML_BOTNAME = exports.ML_PREFIX = void 0;
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const utill_1 = require("./utill");
const config_1 = require("../utils/config");
const node_fetch_1 = require("node-fetch");
const ml_1 = require("./utill/ml");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
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
            const arr = (message.content && message.content.split(' ')) || [];
            if (isAdmin && arr[0] === exports.ML_PREFIX) {
                const cmd = arr[1];
                switch (cmd) {
                    case 'url':
                        yield (0, ml_1.addUrl)(exports.ML_BOTNAME, exports.ML_PREFIX, tribe, message, arr);
                        return;
                    case 'api_key':
                        yield (0, ml_1.addApiKey)(exports.ML_BOTNAME, exports.ML_PREFIX, tribe, message, arr);
                        return;
                    case 'kind':
                        yield (0, ml_1.addKind)(exports.ML_BOTNAME, exports.ML_PREFIX, tribe, message, arr);
                        return;
                    case 'add':
                        yield (0, ml_1.addModel)(exports.ML_BOTNAME, exports.ML_PREFIX, tribe, message, arr);
                        return;
                    default:
                        (0, ml_1.defaultCommand)(exports.ML_BOTNAME, exports.ML_PREFIX, message);
                        return;
                }
            }
            if (message.type === constants_1.default.message_types.attachment) {
                const blob = yield (0, ml_1.getAttachmentBlob)(message.media_token, message.media_key, message.media_type, tribe);
                console.log('Image Blob', blob);
                return;
            }
            const bot = yield (0, utill_1.findBot)({ botPrefix: exports.ML_PREFIX, tribe });
            let metaObj = JSON.parse(bot.meta || `{}`);
            const modelsArr = Object.keys(metaObj);
            if (modelsArr.length === 0) {
                (0, ml_1.mlBotResponse)('No model added yet!', message);
                return;
            }
            let meta;
            let content = '';
            if (modelsArr.length === 1) {
                meta = metaObj[modelsArr[0]];
                if (message.content.startsWith(`@${modelsArr[0]}`)) {
                    content = message.content.substring(modelsArr[0].length + 1);
                }
                else {
                    content = message.content;
                }
            }
            else {
                let modelName = '';
                if (message.content.startsWith('@')) {
                    modelName = message.content.substring(1, message.content.indexOf(' '));
                    content = message.content.substring(modelName.length + 1);
                }
                else {
                    (0, ml_1.mlBotResponse)('Specify model name by typing the @ sysmbol followed by model name immediately, without space', message);
                    return;
                }
                meta = metaObj[modelName];
                if (!meta) {
                    (0, ml_1.mlBotResponse)('Please provide a valid model name', message);
                    return;
                }
            }
            const url = meta.url;
            const api_key = meta.apiKey;
            if (!url || !api_key) {
                (0, ml_1.mlBotResponse)('not configured!', message);
                return;
            }
            let host_name = config.host_name;
            if (!host_name.startsWith('http')) {
                host_name = `https://${host_name}`;
            }
            const r = yield (0, node_fetch_1.default)(url, {
                method: 'POST',
                body: JSON.stringify({
                    message: content.trim(),
                    webhook: `${host_name}/ml`,
                }),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const j = yield r.json();
            if (!j.body) {
                (0, ml_1.mlBotResponse)('failed to process message (no body)', message);
                return;
            }
            let process_id = j.body && j.body.process_id;
            if (!process_id) {
                (0, ml_1.mlBotResponse)('failed to process message', message);
                return;
            }
            exports.CALLBACKS[process_id] = function (msg) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor(exports.ML_BOTNAME)
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
            console.log(e);
            logger_1.sphinxLogger.error(`ML CALL FAILED: ${e}`, logger_1.logging.Bots);
        }
    }));
}
exports.init = init;
//# sourceMappingURL=ml.js.map