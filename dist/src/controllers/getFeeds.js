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
exports.getFeeds = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const feedsHelper = require("../utils/feeds");
const config_1 = require("../utils/config");
const node_fetch_1 = require("node-fetch");
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
            console.log(parsedRecommendation);
            if (parsedRecommendation.success) {
                (0, res_1.success)(res, parsedRecommendation.data);
            }
            else {
                (0, res_1.failure)(res, 'An error occured');
            }
        }
        catch (error) {
            (0, res_1.failure)(res, error);
        }
    });
}
exports.getFeeds = getFeeds;
//# sourceMappingURL=getFeeds.js.map