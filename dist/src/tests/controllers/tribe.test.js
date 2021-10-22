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
ava_1.default.serial('tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield tribeTest(t, node1, node2);
    }));
}));
function tribeTest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 CREATES A TRIBE
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
        t.true(tribeMessage, 'node1 should send message to tribe');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node2, node1, text2, tribe);
        t.true(tribeMessage2, 'node1 should send message to tribe');
        //NODE2 LEAVES THE TRIBE
        let left = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left, 'node2 should leave tribe');
        //NODE2 LEAVES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=tribe.test.js.map