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
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const spamGone_1 = require("./utill/spamGone");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const botPrefix = '/spam_gone';
const botName = 'SpamGoneBot';
function init() {
    if (initted)
        return;
    initted = true;
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
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        if (!isAdmin)
            return;
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            switch (cmd) {
                case 'add':
                    yield (0, spamGone_1.addPubkeyToSpam)(arr, botPrefix, botName, tribe, message);
                    return;
                case 'list':
                    yield (0, spamGone_1.listAllPubkeys)(arr, botPrefix, botName, tribe, message);
                    return;
                case 'remove':
                    yield (0, spamGone_1.removePubkeyFromSpam)(arr, botPrefix, botName, tribe, message);
                    return;
                default:
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor(botName)
                        .setTitle('Bot Commands:')
                        .addFields([
                        {
                            name: 'Add Pubkey to Spam_Gone list',
                            value: '/spam_gone add ${pubkey}',
                        },
                        {
                            name: 'Remove Pubkey from Spam_Gone list',
                            value: '/spam_gone remove ${pubkey}',
                        },
                        {
                            name: 'List all Pubkey on Spam_Gone list',
                            value: '/spam_gone list',
                        },
                    ])
                        .setOnlyOwner(true);
                    message.channel.send({ embed });
                    return;
            }
        }
        catch (error) { }
    }));
}
exports.init = init;
//# sourceMappingURL=spamGone.js.map