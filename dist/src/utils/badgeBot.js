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
exports.createBadgeBot = void 0;
const constants_1 = require("../constants");
const models_1 = require("../models");
function createBadgeBot(chatId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const badge = yield models_1.models.ChatBot.findOne({
            where: { tenant, chatId, botPrefix: '/badge' },
        });
        if (!badge) {
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
            };
            yield models_1.models.ChatBot.create(chatBot);
        }
    });
}
exports.createBadgeBot = createBadgeBot;
//# sourceMappingURL=badgeBot.js.map