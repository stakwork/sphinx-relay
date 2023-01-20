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
exports.addContentFeedStatus = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
function addContentFeedStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { contents } = req.body;
        if (!Array.isArray(contents))
            return (0, res_1.failure)(res, 'Invalid Content Feed Status');
        try {
            yield models_1.models.ContentFeedStatus.destroy({
                where: { tenant },
            });
            const data = [];
            for (let i = 0; i < contents.length; i++) {
                const content = contents[i];
                if (content.feed_id &&
                    content.feed_url &&
                    typeof content.subscription_status === 'boolean') {
                    const contentObj = {
                        feedId: content.feed_id,
                        feedUrl: content.feed_url,
                        subscriptionStatus: content.subscription_status,
                        chatId: content.chat_id,
                        itemId: content.item_id,
                        episodesStatus: JSON.stringify(content.episodes_status),
                        satsPerMinute: content.sats_per_minute,
                        playerSpeed: content.player_speed,
                        tenant,
                    };
                    data.push(contentObj);
                }
                else {
                    throw 'Invalid Content Feed Status';
                }
            }
            yield models_1.models.ContentFeedStatus.bulkCreate(data);
            return (0, res_1.success)(res, 'Content Feed Status added successfully');
        }
        catch (error) {
            let errorMsg = 'An internal error occured';
            if (error === 'Invalid Content Feed Status') {
                errorMsg = 'Invalid Content Feed Status';
            }
            return (0, res_1.failure)(res, errorMsg);
        }
    });
}
exports.addContentFeedStatus = addContentFeedStatus;
//# sourceMappingURL=contentFeedStatus.js.map