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
const nodes_1 = require("../nodes");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const helpers_1 = require("../utils/helpers");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
ava_1.default.serial('tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield tribeTest(t, node1, node2);
    }));
}));
function tribeTest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 CREATES A TRIBE
        console.log('NODE:', node1.alias, '->', node2.alias);
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text = (0, helpers_1.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node1, node2, text, tribe);
        t.true(!!tribeMessage, 'node1 should send message to tribe');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node2, node1, text2, tribe);
        t.true(!!tribeMessage2, 'node1 should send message to tribe');
        //NODE2 LEAVES THE TRIBE
        let left = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left, 'node2 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
ava_1.default.serial('Tribe test for seeing that if 2 nodes have the same alias, the sender alias is changed', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield tribeUniqueAliasTest(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
// Tests that if 2 nodes with the same alias join a tribe, their alias assigned in the tribes is different
function tribeUniqueAliasTest(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 creates a tribe
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //Set the alias of NODE2 to be the same as NODE1
        let old_alias = node2.alias;
        let newAlias = { alias: node1.alias };
        const change = yield (0, save_1.updateProfile)(t, node2, newAlias);
        t.true(change, 'node2 should have updated its profile');
        const newNode2 = yield (0, get_1.getSelf)(t, node2);
        t.true(newNode2.alias !== old_alias, 'node2 alias should not be equal to old alias');
        t.true(newNode2.alias === node1.alias, 'node2 alias should be equal node1 alias');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //First node1 sends a message in tribe
        let text = (0, helpers_1.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node1, node3, text, tribe);
        t.true(!!tribeMessage, 'node1 should send message to tribe');
        //Then node2 sends a message in tribe
        let text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node2, node3, text2, tribe);
        t.true(!!tribeMessage2, 'node2 should send message to tribe');
        let message1 = yield (0, get_1.getCheckNewMsgs)(t, node3, tribeMessage.uuid);
        let message2 = yield (0, get_1.getCheckNewMsgs)(t, node3, tribeMessage2.uuid);
        t.true(message1.sender_alias !== message2.sender_alias, 'The sender alias in both messages should be different');
        //Check that our logic for assigning an alternate alias is working
        t.true(message2.sender_alias === `${node1.alias}_2`, 'The sender alias should be modified according to our unique alias logic');
        //NODE3 LEAVES THE TRIBE
        let left1 = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(left1, 'node3 should leave tribe');
        //NODE2 LEAVES THE TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE1 LEAVES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=tribe.test.js.map