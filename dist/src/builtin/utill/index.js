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
exports.findBot = exports.botResponse = void 0;
const Sphinx = require("sphinx-bot");
const hideAndUnhideCommand_1 = require("../../controllers/botapi/hideAndUnhideCommand");
const models_1 = require("../../models");
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
function findBot({ botPrefix, tribe, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bot = (yield models_1.models.ChatBot.findOne({
                where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
            }));
            return bot;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.findBot = findBot;
//# sourceMappingURL=index.js.map