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
exports.subscription = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
/*
npx ava src/tests/controllers/subscription.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test subscription: join tribe, create subscription, update subscription', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield subscription(t, 4);
}));
function subscription(t, index) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = nodes_1.default[index];
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node);
        t.truthy(tribe, 'tribe should have been created by node1');
        let body = { chat_id: tribe.id, interval: 'daily' };
        let newSubscription = yield http.post(node.external_ip + '/subscriptions', (0, helpers_1.makeArgs)(node, body));
        t.true(newSubscription.success, 'subscription should be successful');
        let updateBody = { chat_id: tribe.id, interval: 'weekly' };
        let updateSubscription = yield http.put(`${node.external_ip}/subscription/${newSubscription.response.id}`, (0, helpers_1.makeArgs)(node, updateBody));
        t.true(updateSubscription.success, 'subscription should be updated successfuly');
    });
}
exports.subscription = subscription;
//# sourceMappingURL=subscription.test.js.map