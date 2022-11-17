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
// import { sphinxLogger } from '../utils/logger'
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const constants_1 = require("../constants");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
        if (isAdmin)
            return;
        const tribe = (yield models_1.models.Chat.findOne({
            where: { uuid: message.channel.id },
        }));
        const bot = (yield models_1.models.ChatBot.findOne({
            where: { botPrefix: '/badge' },
        }));
        const chatMember = (yield models_1.models.ChatMember.findOne({
            where: { contactId: parseInt(message.member.id), tenant: tribe.tenant },
        }));
        // https://liquid.sphinx.chat/balances?pubkey=0305b986cd1a586fa89f08dd24d6c2b81d1146d8e31233ff66851aec9806af163f
        if (typeof bot.meta === 'string') {
            const rewards = JSON.parse(bot.meta);
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                if (reward.rewardType === constants_1.default.reward_types.earned) {
                    if (chatMember.totalEarned === reward.amount ||
                        chatMember.totalEarned > reward.amount) {
                    }
                }
                else if (reward.rewardType === constants_1.default.reward_types.spent) {
                    if (chatMember.totalSpent === reward.amount ||
                        chatMember.totalSpent > reward.amount) {
                    }
                }
            }
        }
        // check who the message came from
        // check their Member table to see if it cross the amount
        // reward the badge (by calling "/transfer" on element server)
        // create a text message that says "X badge was awarded to ALIAS for spending!"
        // auto-create BadgeBot in a tribe on any message (if it doesn't exist)
        // reward data can go in "meta" column of ChatBot
        // reward types: earned, spent, posted
        // json array like [{badgeId: 1, rewardType: 1, amount: 100000}]
    }));
}
exports.init = init;
//# sourceMappingURL=badge.js.map