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
exports.testFees = void 0;
const ava_1 = require("ava");
const helpers = require("../utils/helpers");
// import {
//   sendMessageAndCheckDecryption,
//   sendInvoice,
//   payInvoice,
// } from '../utils/msg'
const nodes_1 = require("../nodes");
const keysend_1 = require("../utils/keysend");
const get_1 = require("../utils/get");
/*
  npx ava src/tests/controllers/fees.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('Fees: update channel policy, make keysend payment, check balance', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield testFees(t, 0, 1, 2, 3, 4);
}));
function testFees(t, index1, index2, index3, index4, index5) {
    return __awaiter(this, void 0, void 0, function* () {
        let alice = nodes_1.default[index1];
        let bob = nodes_1.default[index2];
        let carol = nodes_1.default[index3];
        //   let dave = nodes[index4]
        let virtualNode0 = nodes_1.default[index5];
        const newFee = 10;
        const channelUpdate2 = yield helpers.updateChannelPolicy(t, alice, newFee);
        t.true(channelUpdate2.success, 'Channel policy is updated successfully');
        yield helpers.sleep(4000);
        const getBalanceBefore = yield (0, get_1.getBalance)(t, virtualNode0);
        const keysend_amount = 80;
        //VirtualNode0 sent some sats to Carol
        const keysend3 = yield (0, keysend_1.keysend)(t, virtualNode0, carol, keysend_amount);
        t.true(keysend3.success, 'Keysend payment should be successful');
        const getBalanceAfter = yield (0, get_1.getBalance)(t, virtualNode0);
        const total_cost = newFee + keysend_amount;
        t.true(getBalanceBefore - getBalanceAfter === total_cost, 'Balance difference should be fee plus amount sent');
        const getBalanceBefore2 = yield (0, get_1.getBalance)(t, virtualNode0);
        const keysend_amount2 = 80;
        yield helpers.sleep(1000);
        //VirtualNode0 sent some sats to Bob
        const keysend4 = yield (0, keysend_1.keysend)(t, virtualNode0, bob, keysend_amount2);
        t.true(keysend4.success, 'Keysend payment should be successful');
        const getBalanceAfter2 = yield (0, get_1.getBalance)(t, virtualNode0);
        const total_cost2 = newFee + keysend_amount;
        t.true(getBalanceBefore2 - getBalanceAfter2 === total_cost2, 'Balance difference should be fee plus amount sent');
        //Update Alice Channel Policy
        const channelUpdate = yield helpers.updateChannelPolicy(t, alice, 100);
        t.true(channelUpdate.success, 'Channel policy is updated successfully');
        yield helpers.sleep(1000);
        //VirtualNode0 tries to send some sats to bob
        const keysend1 = yield (0, keysend_1.keysend)(t, virtualNode0, bob, 3);
        t.false(keysend1.success, 'Keysend should fail because fee is too high');
        //VirtualNode0 tries to send some sats to carol
        yield helpers.sleep(1000);
        const keysend2 = yield (0, keysend_1.keysend)(t, virtualNode0, carol, 200);
        t.false(keysend2.success, 'Keysend should fail because fee is too high');
        //Update Alice Channel Policy
        const channelUpdate3 = yield helpers.updateChannelPolicy(t, alice, 0);
        t.true(channelUpdate3.success, 'Channel policy is updated successfully');
    });
}
exports.testFees = testFees;
//# sourceMappingURL=fees.test.js.map