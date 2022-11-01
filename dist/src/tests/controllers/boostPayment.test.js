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
exports.boostPayment = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava src/tests/controllers/boostPayment.test.ts --verbose --serial --timeout=2m
*/
ava_1.default('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield boostPayment(t, 0, 1, 2);
}));
function boostPayment(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        let node3 = nodes_1.default[index3];
        t.truthy(node3, 'this test requires three nodes');
        console.log(`Checking boost messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield save_1.createTribe(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield save_1.joinTribe(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield save_1.joinTribe(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //NODE1 SENDS A MESSAGE IN THE TRIBE AND NODE2 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text = helpers_1.randomText();
        let tribeMessage1 = yield msg_1.sendTribeMessageAndCheckDecryption(t, node1, node2, text, tribe);
        t.truthy(tribeMessage1, 'node1 should send message to tribe');
        //NODE2 SENDS A MESSAGE IN THE TRIBE AND NODE3 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text2 = helpers_1.randomText();
        let tribeMessage2 = yield msg_1.sendTribeMessageAndCheckDecryption(t, node2, node3, text2, tribe);
        t.truthy(tribeMessage2, 'node2 should send message to tribe');
        //NODE3 SENDS A MESSAGE IN THE TRIBE AND NODE1 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text3 = helpers_1.randomText();
        let tribeMessage3 = yield msg_1.sendTribeMessageAndCheckDecryption(t, node3, node1, text3, tribe);
        t.truthy(tribeMessage3, 'node3 should send message to tribe');
        //NODE1 SENDS A BOOST ON NODE2'S MESSAGE
        const boost = yield msg_1.sendBoost(t, node1, node2, tribeMessage2, 11, tribe);
        t.true(boost.success);
        //NODE2 SENDS A BOOST ON NODE3'S MESSAGE
        const boost2 = yield msg_1.sendBoost(t, node2, node3, tribeMessage3, 12, tribe);
        t.true(boost2.success);
        //NODE3 SENDS A BOOST ON NODE1'S MESSAGE
        const boost3 = yield msg_1.sendBoost(t, node3, node1, tribeMessage1, 13, tribe);
        t.true(boost3.success);
        //NODE2 LEAVES TRIBE
        let left2 = yield del_1.leaveTribe(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE3 LEAVES TRIBE
        let left3 = yield del_1.leaveTribe(t, node3, tribe);
        t.true(left3, 'node3 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield del_1.deleteTribe(t, node1, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.boostPayment = boostPayment;
//# sourceMappingURL=boostPayment.test.js.map