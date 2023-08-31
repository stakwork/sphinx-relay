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
exports.getOgMessage = exports.getAttachmentBlob = exports.mlBotResponse = exports.addModel = exports.defaultCommand = exports.addKind = exports.addApiKey = exports.addUrl = void 0;
const models_1 = require("../../models");
const index_1 = require("./index");
const Sphinx = require("sphinx-bot");
const ml_1 = require("../ml");
const logger_1 = require("../../utils/logger");
const ldat_1 = require("../../utils/ldat");
const node_fetch_1 = require("node-fetch");
const meme = require("../../utils/meme");
const RNCryptor = require("jscryptor-3");
function addUrl(botName, botPrefix, tribe, messageObj, msgArr) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = msgArr[1];
        const name = msgArr[2];
        const url = msgArr[3];
        try {
            if (!name || !url) {
                yield (0, index_1.botResponse)(botName, `Please provide a valid model ${name ? 'url' : 'name'}`, botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let metaObj = JSON.parse(bot.meta || `{}`);
            const meta = metaObj[name];
            if (!meta) {
                yield (0, index_1.botResponse)(botName, 'Model does not exist', botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            metaObj[name] = Object.assign(Object.assign({}, meta), { url });
            yield bot.update({ meta: JSON.stringify(metaObj) });
            yield (0, index_1.botResponse)(botName, `${name.toUpperCase()} URL updated successfully`, botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error trying to update URL: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || 'Error trying to update URL', botPrefix, tribe.id, messageObj, cmd);
            return;
        }
    });
}
exports.addUrl = addUrl;
function addApiKey(botName, botPrefix, tribe, messageObj, msgArr) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = msgArr[1];
        const name = msgArr[2];
        const apiKey = msgArr[3];
        try {
            if (!name || !apiKey) {
                yield (0, index_1.botResponse)(botName, `Please provide a valid model ${name ? 'api_key' : 'name'}`, botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let metaObj = JSON.parse(bot.meta || `{}`);
            const meta = metaObj[name];
            if (!meta) {
                yield (0, index_1.botResponse)(botName, 'Model does not exist', botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            metaObj[name] = Object.assign(Object.assign({}, meta), { apiKey });
            yield bot.update({ meta: JSON.stringify(metaObj) });
            yield (0, index_1.botResponse)(botName, `${name.toUpperCase()} API KEY updated successfully`, botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error trying to update API KEY: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || `Error trying to update ${name.toUpperCase()} API KEY`, botPrefix, tribe.id, messageObj, cmd);
            return;
        }
    });
}
exports.addApiKey = addApiKey;
function addKind(botName, botPrefix, tribe, messageObj, msgArray) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = msgArray[1];
        const name = msgArray[2];
        const kind = msgArray[3];
        try {
            if (!name || !kind) {
                yield (0, index_1.botResponse)(botName, `Please provide a valid model ${name ? 'kind' : 'name'}`, botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            if (kind !== 'text' && kind !== 'image') {
                yield (0, index_1.botResponse)(botName, 'Please provide a valid kind (text/image)', botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let metaObj = JSON.parse(bot.meta || `{}`);
            const meta = metaObj[name];
            if (!meta) {
                yield (0, index_1.botResponse)(botName, 'Model does not exist', botPrefix, tribe.id, messageObj, cmd);
                return;
            }
            metaObj[name] = Object.assign(Object.assign({}, meta), { kind });
            yield bot.update({ meta: JSON.stringify(metaObj) });
            yield (0, index_1.botResponse)(botName, `${name.toUpperCase()} kind updated to ${kind}`, botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error trying to update kind: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || `Error trying to update ${name.toUpperCase()} kind`, botPrefix, tribe.id, messageObj, cmd);
            return;
        }
    });
}
exports.addKind = addKind;
function defaultCommand(botName, botPrefix, message) {
    const embed = new Sphinx.MessageEmbed()
        .setAuthor(botName)
        .setTitle('Bot Commands:')
        .addFields([
        {
            name: `Add URL to ${botName}`,
            value: `${botPrefix} url {MODEL_NAME} {URL}`,
        },
        {
            name: `Add API_KEY to ${botName}`,
            value: `${botPrefix} api_key {MODEL_NAME} {API_KEY}`,
        },
        {
            name: `Set content type`,
            value: `${botPrefix} kind {MODEL_NAME} {text/image}`,
        },
    ])
        .setOnlyOwner(true);
    message.channel.send({ embed });
}
exports.defaultCommand = defaultCommand;
function addModel(botName, botPrefix, tribe, messageObject, msgArr) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = msgArr[1];
        const name = msgArr[2];
        const url = msgArr[3];
        try {
            if (!name) {
                yield (0, index_1.botResponse)(botName, 'Please provide a valid model name', botPrefix, tribe.id, messageObject, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let metaObj = JSON.parse(bot.meta || `{}`);
            const meta = metaObj[name];
            if (meta) {
                yield (0, index_1.botResponse)(botName, 'Model already exist', botPrefix, tribe.id, messageObject, cmd);
                return;
            }
            const newModel = { name, apiKey: '', url: url || '', kind: 'text' };
            metaObj[name] = Object.assign({}, newModel);
            yield bot.update({ meta: JSON.stringify(metaObj) });
            yield (0, index_1.botResponse)(botName, 'New model added successfully', botPrefix, tribe.id, messageObject, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`error while adding model: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || 'Error occured while adding a model', botPrefix, tribe.id, messageObject, cmd);
            return;
        }
    });
}
exports.addModel = addModel;
function mlBotResponse(msg, message) {
    const embed = new Sphinx.MessageEmbed()
        .setAuthor(ml_1.ML_BOTNAME)
        .setDescription(msg)
        .setOnlyUser(parseInt(message.member.id || '0'));
    message.channel.send({ embed });
}
exports.mlBotResponse = mlBotResponse;
function getAttachmentBlob(mediaToken, mediaKey, mediaType, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mediaToken || !mediaKey)
            return;
        const ownerPubkey = tribe.ownerPubkey;
        const terms = (0, ldat_1.parseLDAT)(mediaToken);
        if (!terms.host)
            return;
        const token = yield meme.lazyToken(ownerPubkey, terms.host);
        let protocol = 'https';
        if (terms.host.includes('localhost') || terms.host.includes('meme.sphinx'))
            protocol = 'http';
        const r = yield (0, node_fetch_1.default)(`${protocol}://${terms.host}/file/${mediaToken}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const buf = yield r.buffer();
        const imgBuf = RNCryptor.Decrypt(buf.toString('base64'), mediaKey);
        return imgBuf;
    });
}
exports.getAttachmentBlob = getAttachmentBlob;
function getOgMessage(uuid, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield models_1.models.Message.findOne({
            where: { uuid, tenant },
        }));
    });
}
exports.getOgMessage = getOgMessage;
//# sourceMappingURL=ml.js.map