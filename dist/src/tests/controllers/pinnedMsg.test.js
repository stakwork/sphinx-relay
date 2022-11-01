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
ava_1.default.serial('tribe pinned msg', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield tribeTest(t, nodes_1.default[0]);
}));
function tribeTest(t, node1) {
    return __awaiter(this, void 0, void 0, function* () {
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        const pin = yield (0, save_1.pinMsgToTribe)(t, node1, tribe.id, 'PIN');
        t.true(pin === 'PIN', 'pin should equal');
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=pinnedMsg.test.js.map