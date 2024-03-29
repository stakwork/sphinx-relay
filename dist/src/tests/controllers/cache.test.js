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
exports.cacheMessage = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
const get_1 = require("../utils/get");
/*
npx ava src/tests/controllers/cache.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test cache: create tribe, join tribe, send messages,verify message got to tribe, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield cacheMessage(t, 4, 1, 2);
}));
function cacheMessage(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        let node3 = nodes_1.default[index3];
        console.log(`Checking cache messages in tribe for ${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE4 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node4');
        let setPreview = yield (0, save_1.setTribePreview)(t, node1, tribe, 'localhost:8008');
        t.true(setPreview, 'Node1 has added preview to tribe');
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
        let tribeMessage1 = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        t.truthy(tribeMessage1, 'node1 should send message to tribe');
        yield (0, helpers_1.sleep)(1000);
        const cacheMsg = yield (0, get_1.getCacheMsg)(t, tribe, tribeMessage1, text);
        t.true(cacheMsg, 'Message Should exist on Cache server');
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text2);
        t.truthy(tribeMessage2, 'node2 should send message to tribe');
        yield (0, helpers_1.sleep)(1000);
        const msgExist = yield (0, get_1.getMsgByUuid)(t, node1, tribeMessage2);
        t.truthy(msgExist, 'Message should be seen by node 1');
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
exports.cacheMessage = cacheMessage;
//# sourceMappingURL=cache.test.js.map