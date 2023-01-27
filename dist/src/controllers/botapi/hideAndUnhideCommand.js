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
exports.determineOwnerOnly = exports.hideCommandHandler = void 0;
const Sphinx = require("sphinx-bot");
const models_1 = require("../../models");
function hideCommandHandler(hideCommand, commands, tribeId, message, botName, botPrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        if (hideCommand) {
            if (commands.includes(hideCommand)) {
                const bot = (yield models_1.models.ChatBot.findOne({
                    where: { botPrefix: botPrefix, chatId: tribeId },
                }));
                if (!bot.hiddenCommands) {
                    yield bot.update({
                        hiddenCommands: JSON.stringify([hideCommand]),
                    });
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor(botName)
                        .setDescription('Command was added successfully')
                        .setOnlyOwner(yield determineOwnerOnly(botPrefix, 'hide', tribeId));
                    message.channel.send({ embed });
                    return;
                }
                else {
                    let savedCommands = JSON.parse(bot.hiddenCommands);
                    if (!savedCommands.includes(hideCommand)) {
                        yield bot.update({
                            hiddenCommands: JSON.stringify([...savedCommands, hideCommand]),
                        });
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor(botName)
                            .setDescription('Command was added successfully')
                            .setOnlyOwner(yield determineOwnerOnly(botPrefix, 'hide', tribeId));
                        message.channel.send({ embed });
                        return;
                    }
                    else {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor(botName)
                            .setDescription('Command was already added')
                            .setOnlyOwner(yield determineOwnerOnly(botPrefix, 'hide', tribeId));
                        message.channel.send({ embed });
                        return;
                    }
                }
            }
            else {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor(botName)
                    .setDescription('Please this command is not valid')
                    .setOnlyOwner(yield determineOwnerOnly(botPrefix, 'hide', tribeId));
                message.channel.send({ embed });
                return;
            }
        }
        else {
            const embed = new Sphinx.MessageEmbed()
                .setAuthor(botName)
                .setDescription('Please provide a valid command you would like to hide')
                .setOnlyOwner(yield determineOwnerOnly(botPrefix, 'hide', tribeId));
            message.channel.send({ embed });
            return;
        }
    });
}
exports.hideCommandHandler = hideCommandHandler;
function determineOwnerOnly(botPrefix, command, tribeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getBot = (yield models_1.models.ChatBot.findOne({
                where: { botPrefix, chatId: tribeId },
            }));
            if (getBot &&
                getBot.hiddenCommands &&
                JSON.parse(getBot.hiddenCommands).includes(command)) {
                return true;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.determineOwnerOnly = determineOwnerOnly;
//# sourceMappingURL=hideAndUnhideCommand.js.map