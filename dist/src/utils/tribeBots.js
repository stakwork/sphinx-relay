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
exports.makeBotsJSON = exports.declare_bot = exports.delete_bot = void 0;
const node_fetch_1 = require("node-fetch");
const models_1 = require("../models");
const tribes_1 = require("./tribes");
const config_1 = require("./config");
const logger_1 = require("./logger");
const config = (0, config_1.loadConfig)();
function delete_bot({ uuid, owner_pubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = (0, tribes_1.getHost)();
        const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${host}/bots/${uuid}?token=${token}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            const j = yield r.json();
            logger_1.sphinxLogger.info(`=> bot deleted: ${j}`);
            return true;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to delete bot ${e}`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.delete_bot = delete_bot;
function declare_bot({ uuid, name, description, tags, img, price_per_use, owner_pubkey, unlisted, deleted, owner_route_hint, owner_alias, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = (0, tribes_1.getHost)();
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/bots', {
                method: 'POST',
                body: JSON.stringify({
                    uuid,
                    owner_pubkey,
                    name,
                    description,
                    tags,
                    img: img || '',
                    price_per_use: price_per_use || 0,
                    unlisted: unlisted || false,
                    deleted: deleted || false,
                    owner_route_hint: owner_route_hint || '',
                    owner_alias: owner_alias || '',
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            const j = yield r.json();
            logger_1.sphinxLogger.info(`=> bot created: ${j}`);
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to declare bot ${e}`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.declare_bot = declare_bot;
function makeBotsJSON(tribeID) {
    return __awaiter(this, void 0, void 0, function* () {
        const bots = (yield models_1.models.ChatBot.findAll({
            where: {
                chatId: tribeID,
            },
        }));
        if (!bots)
            return [];
        if (!bots.length)
            return [];
        return bots.map((b) => {
            const bot = b.dataValues;
            if (bot.botPrefix === '/loopout') {
                return loopoutBotJSON();
            }
            if (bot.botPrefix === '/testbot') {
                return testBotJSON();
            }
            if (bot.botPrefix === '/bet') {
                return betBotJSON();
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
        commands: [
            {
                command: '*',
                price: 0,
                min_price: 250000,
                max_price: 16777215,
                price_index: 2,
                admin_only: false,
            },
        ],
    };
}
function testBotJSON() {
    return {
        prefix: '/testbot',
        price: 0,
        commands: [
            {
                command: '*',
                price: 0,
                min_price: 20,
                max_price: 50,
                price_index: 1,
                admin_only: false,
            },
        ],
    };
}
function betBotJSON() {
    return {
        prefix: '/bet',
        price: 0,
        commands: [
            {
                command: '*',
                price: 0,
                min_price: 10,
                max_price: 100000,
                price_index: 2,
                admin_only: false,
            },
        ],
    };
}
//# sourceMappingURL=tribeBots.js.map