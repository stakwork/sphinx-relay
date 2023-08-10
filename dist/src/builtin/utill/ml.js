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
exports.defaultCommand = exports.addKind = exports.addApiKey = exports.addUrl = void 0;
const index_1 = require("./index");
const Sphinx = require("sphinx-bot");
function addUrl(bot, meta, botName, botPrefix, tribe, cmd, messageObj, newUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!newUrl) {
            yield (0, index_1.botResponse)(botName, 'Please provide a valid URL', botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        meta.url = newUrl;
        yield bot.update({ meta: JSON.stringify(meta) });
        yield (0, index_1.botResponse)(botName, 'URL updated successfully', botPrefix, tribe.id, messageObj, cmd);
        return;
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
//# sourceMappingURL=ml.js.map