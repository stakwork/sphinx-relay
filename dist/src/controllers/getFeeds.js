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
exports.encrypt = exports.chatBots = exports.getFeeds = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const feedsHelper = require("../utils/feeds");
const config_1 = require("../utils/config");
const node_fetch_1 = require("node-fetch");
const rsa = require("../crypto/rsa");
function getFeeds(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const config = (0, config_1.loadConfig)();
        try {
            const actions = (yield models_1.models.ActionHistory.findAll({
                where: { tenant },
            }));
            const parsedActions = feedsHelper.parseActionHistory(actions);
            const recommendations = yield (0, node_fetch_1.default)(`${config.boltwall_server}/feeds`, {
                method: 'POST',
                body: JSON.stringify(parsedActions),
                headers: { 'Content-Type': 'application/json' },
            });
            const parsedRecommendation = yield recommendations.json();
            (0, res_1.success)(res, parsedRecommendation);
        }
        catch (error) {
            (0, res_1.failure)(res, error);
        }
    });
}
exports.getFeeds = getFeeds;
function chatBots(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        // const tenant: number = req.owner.id
        try {
            const chatBots = yield models_1.models.ChatBot.findAll();
            (0, res_1.success)(res, chatBots);
        }
        catch (error) {
            (0, res_1.failure)(res, error);
        }
    });
}
exports.chatBots = chatBots;
function encrypt(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const message = rsa.encrypt(req.owner.contactKey, req.body.message);
        const remote_text = rsa.encrypt('MIIBCgKCAQEAuhTjCQuoy9vyJddK03eAxxpYzd9Yu6Tgtj2vp7dFvo9TubNgejqI\nqYH0c1aur30gNuCushJ7TzZFrdXLd77vJ6kVcwOQXI1xNERAG8PvBcSPjv7LZWuz\nYwdM3x7HQ+mBqmib7RjxvEyHNlmoVfrPL5R+LA7lXEJcZqGFO5IBQUK8aWhcvK9L\n5KDcJRend9HmMm6eZOVTijwXOkeB27puZJmW32daJxmabNVbct0ut8WrIjIl+B4s\nthbDZblW5zNdmC8x/5708R0+KTnSjR80/y7Y+j5E3+4w/fS9vMc2VMyDhbkc2vYt\nXD7thfQUtRL2C8BE5fIzF4F9/WWpg9hmpwIDAQAB', req.body.message);
        (0, res_1.success)(res, { message, remote_text });
    });
}
exports.encrypt = encrypt;
//# sourceMappingURL=getFeeds.js.map