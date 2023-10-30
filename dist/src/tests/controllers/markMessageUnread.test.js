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
exports.unreadMessages = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava src/tests/controllers/deleteMessages.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test message mark unread: create tribe, join tribe, send messages, read messages, mark unread messages, check number of messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield unreadMessages(t, 0, 1, 2);
}));
function unreadMessages(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        let node3 = nodes_1.default[index3];
        t.truthy(node3, 'this test requires three nodes');
        console.log(`Checking boost messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`);
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
        //NODE1 SENDS A MESSAGE IN THE TRIBE AND NODE2 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text = (0, helpers_1.randomText)();
        let tribeMessage1 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node1, node2, text, tribe);
        t.truthy(tribeMessage1, 'node1 should send message to tribe');
        //NODE2 SENDS A MESSAGE IN THE TRIBE AND NODE3 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node2, node3, text2, tribe);
        t.truthy(tribeMessage2, 'node2 should send message to tribe');
        //NODE3 SENDS A MESSAGE IN THE TRIBE AND NODE1 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text3 = (0, helpers_1.randomText)();
        let tribeMessage3 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text3, tribe);
        t.truthy(tribeMessage3, 'node3 should send message to tribe');
        const text4 = (0, helpers_1.randomText)();
        let tribeMessage4 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text4, tribe);
        t.truthy(tribeMessage4, 'node3 should send message to tribe');
        const text5 = (0, helpers_1.randomText)();
        let tribeMessage5 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text5, tribe);
        t.truthy(tribeMessage5, 'node3 should send message to tribe');
        const text6 = (0, helpers_1.randomText)();
        let tribeMessage6 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text6, tribe);
        t.truthy(tribeMessage6, 'node3 should send message to tribe');
        const text7 = (0, helpers_1.randomText)();
        let tribeMessage7 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text7, tribe);
        t.truthy(tribeMessage7, 'node3 should send message to tribe');
        const text8 = (0, helpers_1.randomText)();
        let tribeMessage8 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node3, node1, text8, tribe);
        t.truthy(tribeMessage8, 'node3 should send message to tribe');
        const tribeMessages = yield (0, msg_1.getTribeMessages)(t, node1, tribe);
        t.true(tribeMessages.length === 10, 'The total number of message left should be 10');
        yield (0, msg_1.readMessages)(node1, tribe);
        // Mark messaages as read here
        const tribeMessages1 = yield (0, msg_1.getTribeMessages)(t, node1, tribe);
        t.true(tribeMessages1[0].chat.seen === 1, 'last message should be read');
        // check that we have less message
        // mark messages as unread
        yield (0, msg_1.markUnread)(node1, tribe);
        // check that we have more messages now
        const tribeMessages2 = yield (0, msg_1.getTribeMessages)(t, node1, tribe);
        t.true(tribeMessages2[0].chat.seen === 0, 'last message should be unread');
        //NODE2 LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE3 LEAVES TRIBE
        let left3 = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(left3, 'node3 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.unreadMessages = unreadMessages;
//# sourceMappingURL=markMessageUnread.test.js.map