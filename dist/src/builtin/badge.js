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
exports.createOrEditBadgeBot = exports.init = void 0;
const Sphinx = require("sphinx-bot");
const logger_1 = require("../utils/logger");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const constants_1 = require("../constants");
const node_fetch_1 = require("node-fetch");
const people_1 = require("../utils/people");
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
                let doReward = false;
                if (reward.rewardType === constants_1.default.reward_types.earned) {
                    if (chatMember.totalEarned === reward.amount ||
                        chatMember.totalEarned > reward.amount) {
                        doReward = true;
                    }
                }
                else if (reward.rewardType === constants_1.default.reward_types.spent) {
                    if (chatMember.totalSpent === reward.amount ||
                        chatMember.totalSpent > reward.amount) {
                        doReward = true;
                    }
                }
                if (doReward) {
                    const hasReward = yield checkReward(parseInt(message.member.id), reward.badgeId, tribe.tenant);
                    if (!hasReward.status) {
                        const badge = yield (0, people_1.transferBadge)({
                            to: hasReward.pubkey,
                            asset: reward.badgeId,
                            amount: 1,
                            memo: '',
                            owner_pubkey: tribe.ownerPubkey,
                            host: 'liquid.sphinx.chat',
                        });
                        if (badge.tx) {
                            const resEmbed = new Sphinx.MessageEmbed()
                                .setAuthor('BagdeBot')
                                .setDescription(`${message.member.nickname} just earned the ${reward.name} badge`);
                            message.channel.send({ embed: resEmbed });
                        }
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
        // json array like [{badgeId: 1, rewardType: 1, amount: 100000, name: Badge name}]
    }));
}
exports.init = init;
function getReward(pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield (0, node_fetch_1.default)(`https://liquid.sphinx.chat/balances?pubkey=${pubkey}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const results = yield res.json();
        console.log(results);
        return results;
    });
}
function checkReward(contactId, rewardId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const contact = (yield models_1.models.Contact.findOne({
            where: { tenant, id: contactId },
        }));
        const rewards = yield getReward(contact.publicKey);
        for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i];
            if (reward.asset_id === rewardId) {
                return { status: true };
            }
        }
        return { pubkey: contact.publicKey, status: false };
    });
}
function createOrEditBadgeBot(chatId, tenant, badge, amount, rewardType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const botExist = (yield models_1.models.ChatBot.findOne({
                where: { botPrefix: '/badge', chatId },
            }));
            if (botExist) {
                let meta = '';
                if (typeof botExist.meta === 'string') {
                    let temMeta = JSON.parse(botExist.meta);
                    if (Array.isArray(temMeta)) {
                        temMeta.push({
                            name: badge.name,
                            amount,
                            badgeId: badge.id,
                            rewardType: rewardType,
                        });
                        meta = JSON.stringify(temMeta);
                    }
                }
                else {
                    let temMeta = [];
                    temMeta.push({
                        name: badge.name,
                        amount,
                        badgeId: badge.id,
                        rewardType: rewardType,
                    });
                    meta = JSON.stringify(temMeta);
                }
                yield botExist.update({ meta });
                return true;
            }
            else {
                let temMeta = [];
                temMeta.push({
                    name: badge.name,
                    amount,
                    badgeId: badge.id,
                    rewardType: rewardType,
                });
                const chatBot = {
                    chatId,
                    botPrefix: '/badge',
                    botType: constants_1.default.bot_types.builtin,
                    msgTypes: JSON.stringify([0]),
                    pricePerUse: 0,
                    tenant,
                    meta: JSON.stringify(temMeta),
                };
                yield models_1.models.ChatBot.create(chatBot);
                return true;
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error(`BADGE BOT ERROR ${error}`, logger_1.logging.Bots);
            return false;
        }
    });
}
exports.createOrEditBadgeBot = createOrEditBadgeBot;
//# sourceMappingURL=badge.js.map