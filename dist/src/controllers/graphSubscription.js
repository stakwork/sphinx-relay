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
exports.getGraphSubscription = exports.addGraphSubscription = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const logger_1 = require("../utils/logger");
function addGraphSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info(`=> saveLsat`, logger_1.logging.Express);
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
        if (Array.isArray(chatIds)) {
            chatIds = JSON.stringify(chatIds);
        }
        try {
            yield models_1.models.GraphSubscription.create({
                name,
                address,
                weight,
                status,
                chatIds,
                tenant,
            });
            return (0, res_1.success)(res, 'Graph Subscription added successfully');
        }
        catch (error) {
            console.log(error);
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
            console.log(error);
            return (0, res_1.failure)(res, 'An internal error occured');
        }
    });
}
exports.getGraphSubscription = getGraphSubscription;
//# sourceMappingURL=graphSubscription.js.map