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
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
ava_1.default.serial('ampMessage: send more sats than one channel can handle to test AMP', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield ampMessage(t, nodes_1.default);
}));
function ampMessage(t, nodes) {
    return __awaiter(this, void 0, void 0, function* () {
        // node  accept-keysend  accept-amp
        // alice      true          true
        // bob        false         true
        // carol      true          false
        // the 3 nodes have 3 2M channels in total with 1M sats local_balance
        //
        //         A
        //     1M / \ 1M
        //       /   \
        //      /     \
        //  1M /       \ 1M
        //    B---------C
        //     1M     1M
        //
        // Test that alice can send a payment of 1.5M sats to bob
        // With only keysend this would not work because she has 2x 1M local_balance
        // The payment should be split in 2 shards of 750k sats each
        //      --- shard of 750k sats ---> C --- forward --->
        //   A                                                  B
        //      --------- second shard of 750k sats --------->
        {
            const node1 = nodes[0];
            const node2 = nodes[1];
            console.log(`amp payment from ${node1.alias} to ${node2.alias}`);
            console.log('adding contact');
            const added = yield (0, save_1.addContact)(t, node1, node2);
            t.true(added, 'n1 should add n2 as contact');
            console.log('contact added');
            console.log(`sending payment ${node1.alias} -> ${node2.alias}`);
            //NODE1 SENDS PAYMENT TO NODE2
            const amount = 1500000;
            const paymentText = 'AMP test 1';
            const payment = yield (0, msg_1.sendPayment)(t, node1, node2, amount, paymentText);
            console.log(payment);
            t.true(payment, 'payment should be sent');
            console.log(`payment sent ${node1.alias} -> ${node2.alias}`);
        }
        // Nodes will try to send AMP, but carol doesn't `accept-amp`
        // Test a payment of 100k sats from bob to carol
        {
            const node1 = nodes[1];
            const node2 = nodes[2];
            console.log(`amp payment from ${node1.alias} to ${node2.alias}`);
            console.log('adding contact');
            const added = yield (0, save_1.addContact)(t, node1, node2);
            t.true(added, 'n1 should add n2 as contact');
            console.log('contact added');
            console.log(`sending payment ${node1.alias} -> ${node2.alias}`);
            //NODE1 SENDS PAYMENT TO NODE2
            const amount = 100000;
            const paymentText = 'AMP test 2';
            const payment = yield (0, msg_1.sendPayment)(t, node1, node2, amount, paymentText);
            console.log(payment);
            t.true(payment, 'payment should be sent');
            console.log(`payment sent ${node1.alias} -> ${node2.alias}`);
        }
        // Carol doesn't `accept-amp`, but that doesn't mean he can't send it
        // Test a payment of 1.8M sats from carol to alice
        {
            const node1 = nodes[2];
            const node2 = nodes[0];
            console.log(`amp payment from ${node1.alias} to ${node2.alias}`);
            console.log('adding contact');
            const added = yield (0, save_1.addContact)(t, node1, node2);
            t.true(added, 'n1 should add n2 as contact');
            console.log('contact added');
            console.log(`sending payment ${node1.alias} -> ${node2.alias}`);
            //NODE1 SENDS PAYMENT TO NODE2
            const amount = 1800000;
            const paymentText = 'AMP test 3';
            const payment = yield (0, msg_1.sendPayment)(t, node1, node2, amount, paymentText);
            console.log(payment);
            t.true(payment, 'payment should be sent');
            console.log(`payment sent ${node1.alias} -> ${node2.alias}`);
        }
    });
}
module.exports = ampMessage;
//# sourceMappingURL=ampPayment.test.js.map