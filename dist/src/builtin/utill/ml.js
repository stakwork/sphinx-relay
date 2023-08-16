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
exports.mlBotResponse = exports.addModel = exports.defaultCommand = exports.addKind = exports.addApiKey = exports.addUrl = void 0;
const index_1 = require("./index");
const Sphinx = require("sphinx-bot");
const ml_1 = require("../ml");
const logger_1 = require("../../utils/logger");
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
            // const bot = await findBot({ botPrefix, tribe })
            // let metaObj: MlMeta[] = JSON.parse(bot.meta || `[]`)
            // const meta = findMetaByName(name, metaObj)
            // if (!meta) {
            //   await botResponse(
            //     botName,
            //     'Model does not exist',
            //     botPrefix,
            //     tribe.id,
            //     messageObj,
            //     cmd
            //   )
            //   return
            // }
            // meta.url = url
            // await bot.update({ meta: JSON.stringify(meta) })
            // await botResponse(
            //   botName,
            //   'URL updated successfully',
            //   botPrefix,
            //   tribe.id,
            //   messageObj,
            //   cmd
            // )
            // return
        }
        catch (error) { }
    });
}
exports.addUrl = addUrl;
function addApiKey(bot, meta, botName, botPrefix, tribe, cmd, messageObj, newApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!newApiKey) {
            yield (0, index_1.botResponse)(botName, 'Please provide a valid API KEY', botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        meta.apiKey = newApiKey;
        yield bot.update({ meta: JSON.stringify(meta) });
        yield (0, index_1.botResponse)(botName, 'API KEY updated successfully', botPrefix, tribe.id, messageObj, cmd);
        return;
    });
}
exports.addApiKey = addApiKey;
function addKind(bot, meta, botName, botPrefix, tribe, cmd, messageObj, newKind) {
    return __awaiter(this, void 0, void 0, function* () {
        if (newKind !== 'text' && newKind !== 'image') {
            yield (0, index_1.botResponse)(botName, 'Please provide a valid kind (text/image)', botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        meta.kind = newKind;
        yield bot.update({ meta: JSON.stringify(meta) });
        yield (0, index_1.botResponse)(botName, `bot kind updated to ${newKind}`, botPrefix, tribe.id, messageObj, cmd);
        return;
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
            value: `${botPrefix} url {URL}`,
        },
        {
            name: `Add API_KEY to ${botName}`,
            value: `${botPrefix} url {API_KEY}`,
        },
        {
            name: `Set content type`,
            value: `${botPrefix} kind {text/image}`,
        },
    ])
        .setOnlyOwner(true);
    message.channel.send({ embed });
}
exports.defaultCommand = defaultCommand;
function addModel(botName, botPrefix, tribe, msgArr, messageObject) {
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
//# sourceMappingURL=ml.js.map