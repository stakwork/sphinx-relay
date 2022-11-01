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
exports.tribe3Private = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
/*
 npx ava src/tests/controllers/tribe3Private.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-13-tribe3Private: create private tribe, nodes ask to join, reject and accept, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield tribe3Private(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function tribe3Private(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //THREE NODES SEND MESSAGES IN A PRIVATE TRIBE ===>
        t.truthy(node3, 'this test requires three nodes');
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1, 0, 0, 0, true);
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
        //NODE1 CHECKS FOR JOIN MESSAGE FROM NODE2
        const tribeId = yield (0, get_1.getTribeId)(t, node1, tribe);
        t.truthy(tribeId, 'tribeId should exist');
        const [n1p1, n2p1] = yield (0, get_1.getCheckContacts)(t, node1, node2);
        t.truthy(n2p1, 'node2 contact should exist');
        const checkJoin = yield (0, get_1.getCheckNewJoin)(t, node1, n2p1.id, tribeId);
        t.truthy(checkJoin, 'join message should have been sent');
        //NODE1 APPROVES NODE2 TO JOIN TRIBE
        const approve = yield (0, msg_1.appRejMember)(t, node1, n2p1.id, checkJoin.id, 'approved');
        t.truthy(approve, 'join should be approved');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text2);
        //NODE1 (ADMIN) SHOULD DECRYPT NODE2'S MESSAGE
        const n1check2 = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage2.uuid, text2);
        t.true(n1check2, 'node1 (admin) should have read and decrypted node2 message');
        //NODE3 SHOULD NOT DECRYPT NODE2'S MESSAGE
        const n3check2 = yield (0, get_1.getFailNewMsgs)(t, node3, tribeMessage2.uuid);
        t.true(n3check2, 'message should not exist');
        //NODE1 CHECK FOR JOIN MESSAGE FROM NODE3
        const [, n3p1] = yield (0, get_1.getCheckContacts)(t, node1, node3);
        t.truthy(n3p1, 'node2 contact should exist');
        const checkJoin2 = yield (0, get_1.getCheckNewJoin)(t, node1, n3p1.id, tribeId);
        t.truthy(checkJoin2, 'join message should have been sent');
        //NODE1 REJECTS NODE3 TO JOIN TRIBE
        const reject = yield (0, msg_1.appRejMember)(t, node1, n3p1.id, checkJoin2.id, 'rejected');
        t.truthy(reject, 'join should be rejected');
        //NODE1 CHECKS THAT ONLY NODE1 AND NODE2 ARE IN THE TRIBE
        const n1tribe = yield (0, get_1.getCheckTribe)(t, node1, tribeId);
        t.truthy(n1tribe, 'get tribe from node1 perspective');
        t.true(n1tribe.contact_ids[0] === n1p1.id, 'only node1 and node2 should be in tribe');
        t.true(n1tribe.contact_ids[1] === n2p1.id, 'only node2 and node1 should be in tribe');
        t.falsy(n1tribe.contact_ids[2], 'there should only be two members of tribe');
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text = (0, helpers_1.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        //NODE2 SHOULD DECRYPT NODE1'S MESSAGE
        const n1check = yield (0, msg_1.checkMessageDecryption)(t, node2, tribeMessage.uuid, text);
        t.true(n1check, 'node1 (admin) should have read and decrypted node2 message');
        //NODE3 SHOULD NOT DECRYPT NODE2'S MESSAGE
        const n3check = yield (0, get_1.getFailNewMsgs)(t, node3, tribeMessage.uuid);
        t.true(n3check, 'message should not exist');
        //NODE3 LEAVES THE TRIBE
        let n3left2 = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(n3left2, 'node3 should leave tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join3 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join3, 'node3 should join tribe');
        //NODE1 CHECK FOR JOIN MESSAGE FROM NODE3
        const checkJoin3 = yield (0, get_1.getCheckNewJoin)(t, node1, n3p1.id, tribeId);
        t.truthy(checkJoin3, 'join message should have been sent');
        //NODE1 ACCEPTS NODE3 TO JOIN TRIBE
        const approve2 = yield (0, msg_1.appRejMember)(t, node1, n3p1.id, checkJoin3.id, 'approved');
        t.truthy(approve2, 'join should be approved');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text3 = (0, helpers_1.randomText)();
        let tribeMessage3 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text3);
        //NODE1 (ADMIN) SHOULD DECRYPT NODE2'S MESSAGE
        const n1check3 = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage3.uuid, text3);
        t.true(n1check3, 'node1 (admin) should have read and decrypted node2 message');
        //NODE3 SHOULD DECRYPT NODE2'S MESSAGE
        const n3check3 = yield (0, msg_1.checkMessageDecryption)(t, node3, tribeMessage3.uuid, text3);
        t.true(n3check3, 'message should exist');
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
exports.tribe3Private = tribe3Private;
//# sourceMappingURL=tribe3Private.test.js.map