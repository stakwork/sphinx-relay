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
const del_1 = require("../utils/del");
const get_1 = require("../utils/get");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava test-20-streamPayment.js --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-20-streamPayment: establish chat, node1 streams payment, node1 streams split payment, delete contacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield streamPayment(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function streamPayment(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND TEXT MESSAGES WITHIN A TRIBE ===>
        t.truthy(node3, 'this test requires three nodes');
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 ADDS NODE2 AS A CONTACT
        let added = yield (0, save_1.addContact)(t, node1, node2);
        t.true(added, 'node1 should add node2 as contact');
        //NODE1 SENDS A TEXT MESSAGE TO NODE2
        const text = (0, helpers_1.randomText)();
        yield (0, msg_1.sendMessageAndCheckDecryption)(t, node1, node2, text);
        //STREAM PAYMENT FROM NODE1 TO NODE2
        var stream1 = yield (0, msg_1.payStream)(t, node1, node2, null, 14);
        t.true(stream1);
        //STREAM SPLIT PAYMENT FROM NODE1 TO NODE2 AND NODE3 (50% SPLIT)
        var stream2 = yield (0, msg_1.payStream)(t, node1, node2, node3, 14);
        t.true(stream2);
        //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
        const allContacts = yield (0, get_1.getContacts)(t, node1);
        let deletion;
        for (const contact of allContacts) {
            if (contact.public_key == node2.pubkey) {
                deletion = yield (0, del_1.deleteContact)(t, node1, contact.id);
                t.true(deletion, 'contacts should be deleted');
            }
        }
    });
}
//# sourceMappingURL=streamPayment.test.js.map