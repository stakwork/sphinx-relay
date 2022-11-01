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
exports.chatInvoice = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
ava_1.default.serial('test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield helpers_1.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield chatInvoice(t, node1, node2);
    }));
}));
function chatInvoice(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>
        console.log(`${node1.alias} and ${node2.alias}`);
        //NODE1 ADDS NODE2 AS A CONTACT
        const added = yield save_1.addContact(t, node1, node2);
        t.true(added, 'n1 should add n2 as contact');
        //NODE1 SENDS A TEXT MESSAGE TO NODE2
        const text = helpers_1.randomText();
        yield msg_1.sendMessageAndCheckDecryption(t, node1, node2, text);
        // t.true(messageSent.success, 'node1 should send text message to node2')
        //NODE2 SENDS A TEXT MESSAGE TO NODE1
        const text2 = helpers_1.randomText();
        yield msg_1.sendMessageAndCheckDecryption(t, node2, node1, text2);
        //t.true(messageSent2.success, 'node2 should send text message to node1')
        //NODE1 SENDS INVOICE TO NODE2
        const amount = 11;
        const paymentText = 'this invoice';
        const invoice = yield msg_1.sendInvoice(t, node1, node2, amount, paymentText);
        t.truthy(invoice, 'invoice should be sent');
        const payReq = invoice.response.payment_request;
        t.truthy(payReq, 'payment request should exist');
        const payInvoice1 = yield msg_1.payInvoice(t, node2, node1, amount, payReq);
        t.true(payInvoice1, 'Node2 should have paid node1 invoice');
        //NODE2 SENDS INVOICE TO NODE1
        const amount2 = 12;
        const paymentText2 = 'that invoice';
        const invoice2 = yield msg_1.sendInvoice(t, node2, node1, amount2, paymentText2);
        t.truthy(invoice2, 'invoice should be sent');
        const payReq2 = invoice2.response.payment_request;
        t.truthy(payReq2, 'payment request should exist');
        const payInvoice2 = yield msg_1.payInvoice(t, node1, node2, amount2, payReq2);
        t.true(payInvoice2, 'Node1 should have paid node2 invoice');
        //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
        const allContacts = yield get_1.getContacts(t, node1);
        let deletion;
        for (const contact of allContacts) {
            if (contact.public_key == node2.pubkey) {
                deletion = yield del_1.deleteContact(t, node1, contact.id);
                t.true(deletion, 'contacts should be deleted');
            }
        }
    });
}
exports.chatInvoice = chatInvoice;
//# sourceMappingURL=chatInvoice.test.js.map