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
const get_1 = require("../utils/get");
/*
npx ava src/tests/controllers/tribe3Escrow.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-12-tribe3Escrow: create tribe, two nodes join tribe, send messages, check escrow, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield tribe3Escrow(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function tribe3Escrow(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>
        t.truthy(node3, 'this test requires three nodes');
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE WITH ESCROW AND PPM
        let tribe = yield (0, save_1.createTribe)(t, node1, 10, 2000, 5);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //NODE2 (non-admin) SENDS A PAID TEXT MESSAGE IN TRIBE
        const text = (0, helpers_1.randomText)();
        let escrowMessage = yield (0, msg_1.sendEscrowMsg)(t, node2, node1, tribe, text);
        t.true(escrowMessage.success, 'node2 (non-admin) should send escrow message to tribe');
        //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check = yield (0, msg_1.checkMessageDecryption)(t, node3, escrowMessage.message.uuid, text);
        t.true(n3check, "node3 (non-admin) should have read and decrypted node2's message");
        const balBefore = yield (0, get_1.getBalance)(t, node2);
        //Bob sends message in a tribe
        const text2 = (0, helpers_1.randomText)();
        const msg = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text2, {
            amount: tribe.escrow_amount + tribe.price_per_message,
        });
        //Admin tries to get sent message
        const msg2 = yield (0, get_1.getCheckNewMsgs)(t, node1, msg.uuid);
        //Get Balance immediately ater a message is sent
        const balImmediatelyAfter = yield (0, get_1.getBalance)(t, node2);
        //Delete Message by Admin
        yield (0, del_1.deleteMessage)(t, node1, msg2.id);
        yield (0, helpers_1.sleep)(tribe.escrow_millis + 5000);
        //Get balance after escrow time
        const balAfterEscrow = yield (0, get_1.getBalance)(t, node2);
        t.true(balBefore - balImmediatelyAfter ===
            tribe.escrow_amount + tribe.price_per_message + 3, 'Difference between balance before and after message should be equal to the sum of escrow and price_per_message');
        t.true(balAfterEscrow === balImmediatelyAfter, 'Balance after escrow should be equal to balance immediately after sending message');
        //NODE2 LEAVES THE TRIBE
        let n2left = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(n2left, 'node2 should leave tribe');
        //NODE3 LEAVES THE TRIBE
        let n3left = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(n3left, 'node3 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
module.exports = tribe3Escrow;
//# sourceMappingURL=tribe3Escrow.test.js.map