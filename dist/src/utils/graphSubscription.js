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
exports.graphQuery = void 0;
const models_1 = require("../models");
function graphQuery(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = (yield models_1.sequelize.query(`
      SELECT * FROM sphinx_graph_subscription_chat
      INNER JOIN sphinx_graph_subscription
      ON sphinx_graph_subscription_chat.subscription_id = sphinx_graph_subscription.id
      WHERE sphinx_graph_subscription_chat.chat_id = ${id}`, {
            model: models_1.models.GraphSubscription,
            mapToModel: true, // pass true here if you have any mapped fields
        }));
        return results;
    });
}
exports.graphQuery = graphQuery;
//# sourceMappingURL=graphSubscription.js.map