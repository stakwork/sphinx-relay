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
exports.externalBotApi = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const bots_1 = require("../utils/bots");
const get_1 = require("../utils/get");
/*
npx ava src/tests/controllers/externalBotApi.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield externalBotApi(t);
}));
function externalBotApi(t) {
    return __awaiter(this, void 0, void 0, function* () {
        let node1 = nodes_1.default[0];
        let node2 = nodes_1.default[1];
        let node3 = nodes_1.default[2];
        let dave = nodes_1.default[3];
        let virtualNode = nodes_1.default[4];
        let virtualNode2 = nodes_1.default[5];
        console.log(`Checking external-api-bot in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias} and ${dave.alias} and ${virtualNode.alias} and ${virtualNode2.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        let join2 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //Dave JOINS TRIBE CREATED BY NODE1
        let join3 = yield (0, save_1.joinTribe)(t, dave, tribe);
        t.true(join3, 'Dave should join tribe');
        //VirtualNode1 JOINS TRIBE CREATED BY NODE1
        let join4 = yield (0, save_1.joinTribe)(t, virtualNode, tribe);
        t.true(join4, 'VirtualNode1 should join tribe');
        //VirtualNode2 JOINS TRIBE CREATED BY NODE1
        let join5 = yield (0, save_1.joinTribe)(t, virtualNode2, tribe);
        t.true(join5, 'VirtualNode2 should join tribe');
        //Node1 Creates Bot via API
        const botAlias = 'test-bot';
        const bot = yield (0, bots_1.createBot)(t, node1, botAlias);
        t.true(bot.success, 'Bot should be created');
        //Node1 sends message with the bot
        yield (0, bots_1.sendBotMessage)(t, node1, bot.response, tribe);
        //Node1 Checks if he receives bot message
        const msg1 = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias, tribe, 1);
        t.truthy(msg1, `${botAlias} message should be found`);
        //Node2 Checks if he receives bot message
        const msg2 = yield (0, get_1.getCheckBotMsg)(t, node2, botAlias, tribe, 1);
        t.truthy(msg2, `${botAlias} message should be found`);
        //Node3 Checks if he receives bot message
        const msg3 = yield (0, get_1.getCheckBotMsg)(t, node3, botAlias, tribe, 1);
        t.truthy(msg3, `${botAlias} message should be found`);
        //Dave Checks if he receives bot message
        const msg4 = yield (0, get_1.getCheckBotMsg)(t, dave, botAlias, tribe, 1);
        t.truthy(msg4, `${botAlias} message should be found`);
        //VirtualNode1 Checks if he receives bot message
        const msg5 = yield (0, get_1.getCheckBotMsg)(t, virtualNode, botAlias, tribe, 1);
        t.truthy(msg5, `${botAlias} message should be found`);
        //VirtualNode2 Checks if he receives bot message
        const msg6 = yield (0, get_1.getCheckBotMsg)(t, virtualNode2, botAlias, tribe, 1);
        t.truthy(msg6, `${botAlias} message should be found`);
        //NODE2 LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE3 LEAVES TRIBE
        let left3 = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(left3, 'node3 should leave tribe');
        //Dave LEAVES TRIBE
        let left4 = yield (0, del_1.leaveTribe)(t, dave, tribe);
        t.true(left4, 'node3 should leave tribe');
        //VirtualNode1 LEAVES TRIBE
        let left5 = yield (0, del_1.leaveTribe)(t, virtualNode, tribe);
        t.true(left5, 'node3 should leave tribe');
        //VirtualNode2 LEAVES TRIBE
        let left6 = yield (0, del_1.leaveTribe)(t, virtualNode2, tribe);
        t.true(left6, 'node3 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.externalBotApi = externalBotApi;
//# sourceMappingURL=externalBotApi.test.js.map