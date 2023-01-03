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
exports.confirmBadgeCreatedThroughMessage = exports.confirmBadge = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function confirmBadge(node, badgeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield getBalances();
        for (let i = 0; i < results.balances.length; i++) {
            const balance = results.balances[i];
            if (balance.asset_id === badgeId) {
                return true;
            }
        }
        return false;
    });
}
exports.confirmBadge = confirmBadge;
function confirmBadgeCreatedThroughMessage(tribeOwner, nodeBeingChecked, chatId, reward_type) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield getBalances();
        const bot = yield http.get(`${tribeOwner.external_ip}/badge_bot/${chatId}`, (0, helpers_1.makeArgs)(tribeOwner));
        const badges = JSON.parse(bot.response.meta);
        for (let i = 0; i < badges.length; i++) {
            const badge = badges[i];
            for (let j = 0; j < results.balances.length; j++) {
                const balance = results.balances[j];
                if (badge.rewardType === Number(reward_type) &&
                    badge.badgeId === balance.asset_id) {
                    return true;
                }
            }
        }
        return false;
    });
}
exports.confirmBadgeCreatedThroughMessage = confirmBadgeCreatedThroughMessage;
function getBalances() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, helpers_1.sleep)(1000);
        return {
            balances: [
                {
                    owner_pubkey: '0364c05cbcbb9612036cc66297445a88bcfc21941fd816e17a56b54b0b52ff02b9',
                    asset_id: 22222222222222222222222222,
                    balance: 1,
                },
            ],
        };
    });
}
//# sourceMappingURL=confirmBadge.js.map