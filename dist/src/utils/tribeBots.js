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
const models_1 = require("../models");
const tribes_1 = require("./tribes");
function declare_bot({ uuid, name, description, tags, img, price_per_use, owner_pubkey, unlisted, deleted }) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = tribes_1.getHost();
        try {
            const r = yield fetch('https://' + host + '/bots', {
                method: 'POST',
                body: JSON.stringify({
                    uuid, owner_pubkey,
                    name, description, tags, img: img || '',
                    price_per_use: price_per_use || 0,
                    unlisted: unlisted || false,
                    deleted: deleted || false,
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const j = yield r.json();
            console.log('=> bot created:', j);
        }
        catch (e) {
            console.log('[tribes] unauthorized to declare');
            throw e;
        }
    });
}
exports.declare_bot = declare_bot;
function makeBotsJSON(tribeID) {
    return __awaiter(this, void 0, void 0, function* () {
        const bots = yield models_1.models.ChatBot.findAll({
            where: {
                chatId: tribeID
            }
        });
        if (!bots)
            return [];
        if (!bots.length)
            return [];
        return bots.map(b => {
            const bot = b.dataValues;
            if (bot.botPrefix === '/loopout') {
                return loopoutBotJSON();
            }
            if (bot.botPrefix === '/testbot') {
                return testBotJSON();
            }
            return {
                prefix: bot.botPrefix,
                price: bot.pricePerUse || 0,
                commands: null,
            };
        });
    });
}
exports.makeBotsJSON = makeBotsJSON;
function loopoutBotJSON() {
    return {
        prefix: '/loopout',
        price: 0,
        commands: [{
                command: '*',
                price: 0,
                min_price: 250000,
                max_price: 16777215,
                price_index: 2,
                admin_only: false
            }]
    };
}
function testBotJSON() {
    return {
        prefix: '/testbot',
        price: 0,
        commands: [{
                command: '*',
                price: 0,
                min_price: 20,
                max_price: 50,
                price_index: 1,
                admin_only: false
            }]
    };
}
//# sourceMappingURL=tribeBots.js.map