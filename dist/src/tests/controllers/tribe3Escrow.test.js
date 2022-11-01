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
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava test-12-tribe3Escrow.js --verbose --serial --timeout=2m
*/
ava_1.default('test-12-tribe3Escrow: create tribe, two nodes join tribe, send messages, check escrow, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield tribe3Escrow(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function tribe3Escrow(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>
        t.truthy(node3, 'this test requires three nodes');
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE WITH ESCROW AND PPM
        let tribe = yield save_1.createTribe(t, node1, 10, 2000, 5);
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
        //NODE2 (non-admin) SENDS A PAID TEXT MESSAGE IN TRIBE
        const text = helpers_1.randomText();
        let escrowMessage = yield msg_1.sendEscrowMsg(t, node2, node1, tribe, text);
        t.true(escrowMessage.success, 'node2 (non-admin) should send escrow message to tribe');
        //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check = yield msg_1.checkMessageDecryption(t, node3, escrowMessage.message.uuid, text);
        t.true(n3check, "node3 (non-admin) should have read and decrypted node2's message");
        //NODE2 LEAVES THE TRIBE
        let n2left = yield del_1.leaveTribe(t, node2, tribe);
        t.true(n2left, 'node2 should leave tribe');
        //NODE3 LEAVES THE TRIBE
        let n3left = yield del_1.leaveTribe(t, node3, tribe);
        t.true(n3left, 'node3 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield del_1.deleteTribe(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
module.exports = tribe3Escrow;
//# sourceMappingURL=tribe3Escrow.test.js.map