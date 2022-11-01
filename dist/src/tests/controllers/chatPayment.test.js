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
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const del_1 = require("../utils/del");
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
ava_1.default.serial('test-08-chatPayment: add contact, send payments, delete contact', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield helpers_1.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield chatPayment(t, node1, node2);
    }));
}));
function chatPayment(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>
        console.log(`${node1.alias} and ${node2.alias}`);
        console.log(`-- adding contacts ${node1.alias} to ${node2.alias}`);
        //NODE1 ADDS NODE2 AS A CONTACT
        const added = yield save_1.addContact(t, node1, node2);
        t.true(added, 'n1 should add n2 as contact');
        console.log(`-- sending message and checking decryption ${node1.alias} to ${node2.alias}`);
        //NODE1 SENDS A TEXT MESSAGE TO NODE2
        const text = helpers_1.randomText();
        yield msg_1.sendMessageAndCheckDecryption(t, node1, node2, text);
        console.log(`-- sending message and checking decryption ${node2.alias} to ${node1.alias}`);
        //NODE2 SENDS A TEXT MESSAGE TO NODE1
        const text2 = helpers_1.randomText();
        yield msg_1.sendMessageAndCheckDecryption(t, node2, node1, text2);
        //NODE1 SENDS PAYMENT TO NODE2
        const amount = 101;
        const paymentText = 'this eleven payment';
        const payment = yield msg_1.sendPayment(t, node1, node2, amount, paymentText);
        t.true(payment, 'payment should be sent');
        //NODE2 SENDS PAYMENT TO NODE1
        const amount2 = 102;
        const paymentText2 = 'that twelve payment';
        const payment2 = yield msg_1.sendPayment(t, node2, node1, amount2, paymentText2);
        t.true(payment2, 'payment should be sent');
        //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
        //  let deletion = await deleteContact(t, node1, node2)
        //t.true(deletion, 'contacts should be deleted')
        console.log('-- deleting contacts');
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
module.exports = chatPayment;
//# sourceMappingURL=chatPayment.test.js.map