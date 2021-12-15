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
exports.tribe3Msgs = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava test-10-tribe3Msgs.js --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-10-tribe3Msgs: create tribe, two nodes join tribe, send messages, 2 nodes leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield tribe3Msgs(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function tribe3Msgs(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //THREE NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>
        t.truthy(node3, 'this test requires three nodes');
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
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
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text = (0, helpers_1.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n2check = yield (0, msg_1.checkMessageDecryption)(t, node2, tribeMessage.uuid, text);
        t.true(n2check, 'node2 should have read and decrypted node1 message');
        //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check = yield (0, msg_1.checkMessageDecryption)(t, node3, tribeMessage.uuid, text);
        t.true(n3check, 'node3 should have read and decrypted node1 message');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text2);
        //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n1check = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage2.uuid, text2);
        t.true(n1check, 'node1 should have read and decrypted node2 message');
        //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check2 = yield (0, msg_1.checkMessageDecryption)(t, node3, tribeMessage2.uuid, text2);
        t.true(n3check2, 'node3 should have read and decrypted node2 message');
        //NODE3 SENDS A TEXT MESSAGE IN TRIBE
        const text3 = (0, helpers_1.randomText)();
        let tribeMessage3 = yield (0, msg_1.sendTribeMessage)(t, node3, tribe, text3);
        //CHECK THAT NODE3'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n1check2 = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage3.uuid, text3);
        t.true(n1check2, 'node1 should have read and decrypted node3 message');
        //CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n2check2 = yield (0, msg_1.checkMessageDecryption)(t, node2, tribeMessage3.uuid, text3);
        t.true(n2check2, 'node2 should have read and decrypted node3 message');
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
exports.tribe3Msgs = tribe3Msgs;
//# sourceMappingURL=tribe3Messages.test.js.map