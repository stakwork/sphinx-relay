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
exports.getGraphSubscriptionForTribe = exports.getGraphSubscription = exports.addGraphSubscription = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const logger_1 = require("../utils/logger");
function addGraphSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const owner = req.owner;
        logger_1.sphinxLogger.info(`=> saveGraphSubscription`, logger_1.logging.Express);
        const { name, address, weight, status } = req.body;
        let { chatIds } = req.body;
        if (!name || !address || !weight) {
            return (0, res_1.failure)(res, 'Missing required Graph Subscription data');
        }
        if (typeof status !== 'number' || status > 1) {
            return (0, res_1.failure)(res, 'Provide valid graph status');
        }
        if (chatIds !== 'all' && !Array.isArray(chatIds)) {
            return (0, res_1.failure)(res, 'Provide valid tribe Id');
        }
        try {
            const graph = (yield models_1.models.GraphSubscription.create({
                name,
                address,
                weight,
                status,
                tenant,
            }));
            if (Array.isArray(chatIds)) {
                for (let i = 0; i < chatIds.length; i++) {
                    const chatId = Number(chatIds[i]);
                    if (!isNaN(chatId)) {
                        const chat = (yield models_1.models.Chat.findOne({
                            where: { id: chatId },
                        }));
                        if (chat && chat.ownerPubkey === owner.publicKey) {
                            yield models_1.models.GraphSubscriptionChat.create({
                                chatId: chat.id,
                                subscriptionId: graph.id,
                            });
                        }
                    }
                }
            }
            else if (chatIds === 'all') {
                const chats = (yield models_1.models.Chat.findAll({
                    where: { ownerPubkey: owner.publicKey },
                }));
                for (let i = 0; i < chats.length; i++) {
                    const chat = chats[i];
                    yield models_1.models.GraphSubscriptionChat.create({
                        chatId: chat.id,
                        subscriptionId: graph.id,
                    });
                }
            }
            return (0, res_1.success)(res, 'Graph Subscription added successfully');
        }
        catch (error) {
            logger_1.sphinxLogger.error(`=> saveGraphSubscription error: ${error}`, logger_1.logging.Express);
            return (0, res_1.failure)(res, 'An internal error occured');
        }
    });
}
exports.addGraphSubscription = addGraphSubscription;
function getGraphSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        try {
            const graphs = (yield models_1.models.GraphSubscription.findAll());
            const newGraphs = [];
            for (let i = 0; i < graphs.length; i++) {
                const graph = graphs[i];
                const lsat = (yield models_1.models.Lsat.findOne({
                    where: { paths: graph.address, status: 1 },
                }));
                const obj = {
                    client_name: graph.name,
                    prediction_endpoint: graph.address,
                    lsat: lsat ? `${lsat.macaroon}:${lsat.preimage}` : '',
                };
                newGraphs.push(obj);
            }
            return (0, res_1.success)(res, newGraphs);
        }
        catch (error) {
            logger_1.sphinxLogger.error(`=> getGraphSubscription error: ${error}`, logger_1.logging.Express);
            return (0, res_1.failure)(res, 'An internal error occured');
        }
    });
}
exports.getGraphSubscription = getGraphSubscription;
function getGraphSubscriptionForTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const { id } = req.params;
        if (!id)
            return (0, res_1.failure)(res, 'Provide valid tribe id');
        try {
            // const tribe = await models.Chat.findOne({ where: { id: tribeId } })
            const tribe = (yield models_1.models.Chat.findOne({
                where: { id },
            }));
            if (!tribe)
                return (0, res_1.failure)(res, 'Tribe does not exist');
            const results = (yield models_1.sequelize.query(`
      SELECT * FROM sphinx_graph_subscription_chat
      INNER JOIN sphinx_graph_subscription
      ON sphinx_graph_subscription_chat.subscription_id = sphinx_graph_subscription.id
      WHERE sphinx_graph_subscription_chat.chat_id = ${id}`, {
                model: models_1.models.GraphSubscription,
                mapToModel: true, // pass true here if you have any mapped fields
            }));
            const finalRes = [];
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const obj = {
                    name: result.name,
                    address: result.address,
                    weight: result.weight,
                };
                finalRes.push(obj);
            }
            return (0, res_1.success)(res, finalRes);
        }
        catch (error) {
            logger_1.sphinxLogger.error(`=> getGraphSubscriptionForTribe error: ${error}`, logger_1.logging.Express);
            return (0, res_1.failure)(res, 'An internal error occured');
        }
    });
}
exports.getGraphSubscriptionForTribe = getGraphSubscriptionForTribe;
//# sourceMappingURL=graphSubscription.js.map