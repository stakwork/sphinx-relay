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
    yield cacheMessage(t, 3, 1, 2);
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
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //NODE4 Adds Cache member
        const addMember = yield (0, save_1.addMemberToTribe)(t, node1, tribe, {
            alias: 'cache',
            pub_key: '03f3a6e1b400e29f1a101391660005f0d44d6d18efa3b293b34a084d98d4664f7b',
            contact_key: 'MIIBCgKCAQEAt2RSUo/xlB1dGQBn6Ko4j6w6FyLIQ7CL47qm4ihDapne6bG5dmiBT3lcGmrvjLBJqIKHLejhgRY2VgVU8YK0R94/HWWyz709d7nLhtYBbdWmwIjGD7aDxeRX5ATp0THZbEebfUc/237iqD5Enf6pmzdD9JQgtFU9A8uNjexuULmV1Kq2nr3w2OUlTP1a84UP1Qs0XSlFA0HOBj6OLGcP/VD7H4wbfrZXCIMGQo4LPy+htM4k31Qn0K3LgKfU1bKHzJk+kGYTHThOEpHRUIbd8lOAnZwzIg0P47QvY1pVs5Te26sXvnt5Uxj+hrilg829GfvrIG/TDzb1EXIqZmwM3wIDAQAB',
        });
        t.true(addMember, 'node4 should have added new user to tribe');
        //NODE1 SENDS A MESSAGE IN THE TRIBE AND NODE2 CHECKS TO SEE IF THEY RECEIVED THE MESSAGE
        const text = (0, helpers_1.randomText)();
        let tribeMessage1 = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node1, node2, text, tribe);
        t.truthy(tribeMessage1, 'node1 should send message to tribe');
        const cacheMsg = yield (0, get_1.getCacheMsg)(t, tribe, tribeMessage1, text);
        t.true(cacheMsg, 'Message Should exist on Cache server');
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