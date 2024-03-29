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
exports.getContentFeedStatus = exports.updateContentFeedStatus = exports.getAllContentFeedStatus = exports.addContentFeedStatus = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const logger_1 = require("../utils/logger");
function addContentFeedStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { contents } = req.body;
        if (!Array.isArray(contents))
            return (0, res_1.failure)(res, 'Invalid Content Feed Status');
        logger_1.sphinxLogger.info(`=> Saving Content Feed Status`, logger_1.logging.Express);
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
            logger_1.sphinxLogger.error(`=> Error Saving Content Feed Status: ${error}`, logger_1.logging.Express);
            let errorMsg = 'An internal error occured';
            if (error === 'Invalid Content Feed Status') {
                errorMsg = 'Invalid Content Feed Status';
            }
            return (0, res_1.failure)(res, errorMsg);
        }
    });
}
exports.addContentFeedStatus = addContentFeedStatus;
function getAllContentFeedStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const limit = (req.query.limit && parseInt(req.query.limit)) || 1000;
        const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
        logger_1.sphinxLogger.info(`=> getContentFeedStatus, limit: ${limit}, offset: ${offset}`, logger_1.logging.Express);
        try {
            const result = (yield models_1.models.ContentFeedStatus.findAll({
                where: { tenant },
                limit,
                offset,
            }));
            const parsedContent = [];
            for (let i = 0; i < result.length; i++) {
                const content = result[i];
                const contentObj = {
                    feed_id: content.feedId,
                    feed_url: content.feedUrl,
                    subscription_status: content.subscriptionStatus,
                    chat_id: content.chatId,
                    item_id: content.itemId,
                    episodes_status: JSON.parse(content.episodesStatus),
                    sats_per_minute: content.satsPerMinute,
                    player_speed: content.playerSpeed,
                };
                parsedContent.push(contentObj);
            }
            return (0, res_1.success)(res, parsedContent);
        }
        catch (error) {
            logger_1.sphinxLogger.error(`=> Error Getting Content Feed Status: ${error}`, logger_1.logging.Express);
            return (0, res_1.failure)(res, 'Internal Server Error');
        }
    });
}
exports.getAllContentFeedStatus = getAllContentFeedStatus;
function updateContentFeedStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const feedId = req.params.feed_id;
        const { content } = req.body;
        try {
            const contentExist = (yield models_1.models.ContentFeedStatus.findOne({
                where: { tenant, feedId },
            }));
            if (!contentExist) {
                if (content.feed_url &&
                    typeof content.subscription_status === 'boolean') {
                    yield models_1.models.ContentFeedStatus.create({
                        feedId,
                        feedUrl: content.feed_url,
                        subscriptionStatus: content.subscription_status,
                        chatId: content.chat_id,
                        itemId: content.item_id,
                        episodesStatus: JSON.stringify(content.episodes_status),
                        satsPerMinute: content.sats_per_minute,
                        playerSpeed: content.player_speed,
                        tenant,
                    });
                    return (0, res_1.success)(res, 'Content Status Added Successfully');
                }
                else {
                    return (0, res_1.failure)(res, 'Content not found');
                }
            }
            else {
                const updatedContent = {};
                if (content === null || content === void 0 ? void 0 : content.feed_url)
                    updatedContent.feedUrl = content.feed_url;
                if ((content === null || content === void 0 ? void 0 : content.subscription_status) ||
                    (content === null || content === void 0 ? void 0 : content.subscription_status) === false)
                    updatedContent.subscriptionStatus = content.subscription_status;
                if (content === null || content === void 0 ? void 0 : content.chat_id)
                    updatedContent.chatId = content.chat_id;
                if (content === null || content === void 0 ? void 0 : content.item_id)
                    updatedContent.itemId = content.item_id;
                if (content === null || content === void 0 ? void 0 : content.episodes_status)
                    updatedContent.episodesStatus = JSON.stringify(content.episodes_status);
                if ((content === null || content === void 0 ? void 0 : content.sats_per_minute) || (content === null || content === void 0 ? void 0 : content.sats_per_minute) === 0)
                    updatedContent.satsPerMinute = content.sats_per_minute;
                if (content === null || content === void 0 ? void 0 : content.player_speed)
                    updatedContent.playerSpeed = content.player_speed;
                yield contentExist.update(updatedContent);
                return (0, res_1.success)(res, 'Content updated Successfully');
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error(`=> Error Updating Content Feed Status: ${error}`, logger_1.logging.Express);
            return (0, res_1.failure)(res, 'Internal Server Error');
        }
    });
}
exports.updateContentFeedStatus = updateContentFeedStatus;
function getContentFeedStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const feedId = req.params.feed_id;
        try {
            const contentFeed = (yield models_1.models.ContentFeedStatus.findOne({
                where: { feedId, tenant },
            }));
            if (!contentFeed) {
                return (0, res_1.failure)(res, 'Content Feed does not exist');
            }
            const resContent = {
                feed_id: contentFeed.feedId,
                feed_url: contentFeed.feedUrl,
                subscription_status: contentFeed.subscriptionStatus,
                chat_id: contentFeed.chatId,
                item_id: contentFeed.itemId,
                episodes_status: JSON.parse(contentFeed.episodesStatus),
                sats_per_minute: contentFeed.satsPerMinute,
                player_speed: contentFeed.playerSpeed,
            };
            return (0, res_1.success)(res, resContent);
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.getContentFeedStatus = getContentFeedStatus;
//# sourceMappingURL=contentFeedStatus.js.map