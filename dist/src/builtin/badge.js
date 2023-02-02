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
const hideAndUnhideCommand_1 = require("../controllers/botapi/hideAndUnhideCommand");
const config_1 = require("../utils/config");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const botPrefix = '/badge';
const config = (0, config_1.loadConfig)();
// check who the message came from
// check their Member table to see if it cross the amount
// reward the badge (by calling "/transfer" on element server)
// create a text message that says "X badge was awarded to ALIAS for spending!"
// auto-create BadgeBot in a tribe on any message (if it doesn't exist)
// reward data can go in "meta" column of ChatBot
// reward types: earned, spent, posted
// json array like [{badgeId: 1, rewardType: 1, amount: 100000, name: Badge name}]
function init() {
    if (initted)
        return;
    initted = true;
    const commands = ['types', 'hide', 'create'];
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot) !== '/badge')
            return;
        const arr = (message.content && message.content.split(' ')) || [];
        const cmd = arr[1];
        const tribe = (yield models_1.models.Chat.findOne({
            where: { uuid: message.channel.id },
        }));
        if (arr[0] === botPrefix) {
            const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
            if (!isAdmin)
                return;
            switch (cmd) {
                case 'create':
                    if (arr.length === 7) {
                        const name = arr[2];
                        if (!name) {
                            const addFields = [
                                {
                                    name: 'Badge Bot Error',
                                    value: 'Provide a valid badge name',
                                },
                            ];
                            botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribe.id);
                            return;
                        }
                        const amount = Number(arr[3]);
                        if (isNaN(amount)) {
                            const addFields = [
                                {
                                    name: 'Badge Bot Error',
                                    value: 'Provide a valid amount of badge you would like to create',
                                },
                            ];
                            botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribe.id);
                            return;
                        }
                        const claim_amount = Number(arr[4]);
                        if (isNaN(claim_amount)) {
                            const addFields = [
                                {
                                    name: 'Badge Bot Error',
                                    value: 'Provide a valid amount of sats condition a tribe memeber has to complete to earn this badge',
                                },
                            ];
                            botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribe.id);
                            return;
                        }
                        const reward_type = Number(arr[5]);
                        if (isNaN(reward_type)) {
                            const addFields = [
                                {
                                    name: 'Badge Bot Error',
                                    value: 'Provide a valid amount of badge you would like to create',
                                },
                            ];
                            botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribe.id);
                            return;
                        }
                        const icon = arr[6];
                        if (!icon) {
                            const addFields = [
                                {
                                    name: 'Badge Bot Error',
                                    value: 'Provide a valid Icon url',
                                },
                            ];
                            botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribe.id);
                            return;
                        }
                        const response = yield (0, people_1.createBadge)({
                            icon,
                            amount: amount,
                            name,
                            owner_pubkey: tribe.ownerPubkey,
                        });
                        yield createOrEditBadgeBot(tribe.id, tribe.tenant, response, claim_amount, reward_type);
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('BadgeBot')
                            .setDescription(response.name + ' badge has been added to this tribe')
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed });
                        return;
                    }
                    else {
                        const resEmbed = new Sphinx.MessageEmbed()
                            .setAuthor('BadgeBot')
                            .setTitle('Badge Error:')
                            .addFields([
                            {
                                name: 'Create new badge using the format below',
                                value: '/badge create {BADGE_NAME} {AMOUNT_OF_BADGE_TO_CREATE} {CONDITION_FOR_BADGE_TO_BE CLAIMED} {BADGE_TYPE} {BADGE_ICON}',
                            },
                        ])
                            .setThumbnail(botSVG)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed: resEmbed });
                        return;
                    }
                case 'types':
                    const resEmbed = new Sphinx.MessageEmbed()
                        .setAuthor('BadgeBot')
                        .setTitle('Badge Types:')
                        .addFields([
                        {
                            name: 'Earn Badge',
                            value: '{EARN_BADGE_TYPE} value should be {1}',
                        },
                        {
                            name: 'Spend Badge',
                            value: '{SPEND_BADGE_TYPE} value should be {2}',
                        },
                    ])
                        .setThumbnail(botSVG)
                        .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                    message.channel.send({ embed: resEmbed });
                    return;
                case 'hide':
                    yield (0, hideAndUnhideCommand_1.hideCommandHandler)(arr[2], commands, tribe.id, message, 'BadgeBot', botPrefix);
                    return;
                default:
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('BadgeBot')
                        .setTitle('Bot Commands:')
                        .addFields([
                        {
                            name: 'Create new badge bot',
                            value: '/badge create {BADGE_NAME} {AMOUNT_OF_BADGE_TO_CREATE} {CONDITION_FOR_BADGE_TO_BE CLAIMED} {BADGE_TYPE} {BADGE_ICON}',
                        },
                        { name: 'Help', value: '/badge help' },
                    ])
                        .setThumbnail(botSVG);
                    message.channel.send({ embed });
                    return;
            }
        }
        else {
            const chatMembers = [];
            try {
                const chatMember = (yield models_1.models.ChatMember.findOne({
                    where: {
                        contactId: parseInt(message.member.id),
                        tenant: tribe.tenant,
                        chatId: tribe.id,
                    },
                }));
                chatMembers.push(chatMember);
                if (message.type === constants_1.default.message_types.boost) {
                    const ogMsg = (yield models_1.models.Message.findOne({
                        where: { uuid: message.reply_id },
                    }));
                    const tribeMember = (yield models_1.models.ChatMember.findOne({
                        where: {
                            contactId: ogMsg.sender,
                            tenant: tribe.tenant,
                            chatId: tribe.id,
                        },
                    }));
                    chatMembers.push(tribeMember);
                }
                if (message.type === constants_1.default.message_types.direct_payment) {
                    const ogMsg = (yield models_1.models.Message.findOne({
                        where: { uuid: message.id },
                    }));
                    const tribeMember = (yield models_1.models.ChatMember.findOne({
                        where: {
                            lastAlias: ogMsg.recipientAlias,
                            tenant: ogMsg.tenant,
                            chatId: ogMsg.chatId,
                        },
                    }));
                    chatMembers.push(tribeMember);
                }
                const tribeBadges = (yield models_1.models.TribeBadge.findAll({
                    where: { chatId: tribe.id },
                }));
                if (tribeBadges && tribeBadges.length > 0) {
                    for (let j = 0; j < chatMembers.length; j++) {
                        const chatMember = chatMembers[j];
                        for (let i = 0; i < tribeBadges.length; i++) {
                            const tribeBadge = tribeBadges[i];
                            let doReward = false;
                            if (tribeBadge.rewardType === constants_1.default.reward_types.earned) {
                                if (chatMember.totalEarned === tribeBadge.rewardRequirement ||
                                    chatMember.totalEarned > tribeBadge.rewardRequirement) {
                                    doReward = true;
                                }
                            }
                            else if (tribeBadge.rewardType === constants_1.default.reward_types.spent) {
                                if (chatMember.totalSpent === tribeBadge.rewardRequirement ||
                                    chatMember.totalSpent > tribeBadge.rewardRequirement) {
                                    doReward = true;
                                }
                            }
                            if (doReward) {
                                const ogBadge = (yield models_1.models.Badge.findOne({
                                    where: { id: tribeBadge.badgeId },
                                }));
                                const hasReward = yield checkReward(chatMember.contactId, ogBadge.badgeId, tribe.tenant);
                                if (!hasReward.status) {
                                    const badge = yield (0, people_1.transferBadge)({
                                        to: hasReward.pubkey,
                                        asset: ogBadge.badgeId,
                                        amount: 1,
                                        memo: '',
                                        owner_pubkey: tribe.ownerPubkey,
                                    });
                                    if (badge.tx) {
                                        const resEmbed = new Sphinx.MessageEmbed()
                                            .setAuthor('BagdeBot')
                                            .setDescription(`${chatMember.lastAlias} just earned the ${ogBadge.name} badge!, https://blockstream.info/liquid/asset/${ogBadge.asset} redeem on people.sphinx.chat`);
                                        message.channel.send({ embed: resEmbed });
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                logger_1.sphinxLogger.error(`BADGE BOT ERROR ${error}`, logger_1.logging.Bots);
            }
        }
    }));
}
exports.init = init;
function getReward(pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield (0, node_fetch_1.default)(`${config.boltwall_server}/badge_balance?pubkey=${pubkey}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const results = yield res.json();
        return results.balances;
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
                            asset: badge.asset,
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
                        asset: badge.asset,
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
                    asset: badge.asset,
                });
                const chatBot = {
                    chatId,
                    botPrefix: '/badge',
                    botType: constants_1.default.bot_types.builtin,
                    msgTypes: JSON.stringify([
                        constants_1.default.message_types.message,
                        constants_1.default.message_types.boost,
                        constants_1.default.message_types.direct_payment,
                    ]),
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
function botResponse(addFields, author, title, message, cmd, tribeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const resEmbed = new Sphinx.MessageEmbed()
            .setAuthor(author)
            .setTitle(title)
            .addFields(addFields)
            .setThumbnail(botSVG)
            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribeId));
        message.channel.send({ embed: resEmbed });
    });
}
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
//# sourceMappingURL=badge.js.map