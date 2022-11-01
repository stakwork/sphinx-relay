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
const get_1 = require("../utils/get");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
 npx ava src/tests/controllers/latestTest.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-40-latestTest: create timestamp, add contact and chat, get latest, delete contacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield latestTest(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function latestTest(t, node1, node2, node3 = null) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND TEXT MESSAGES TO EACH OTHER ===>
        var aliases = `${node1.alias} and ${node2.alias}`;
        if (node3)
            aliases = aliases + ` and ${node3 === null || node3 === void 0 ? void 0 : node3.alias}`;
        console.log(aliases);
        //CREATE TIMESTAMP
        const dateq1 = (0, helpers_1.getTimestamp)();
        t.truthy(dateq1, 'timestamp should exist');
        yield (0, helpers_1.sleep)(1000);
        //NODE1 GETS LATEST
        let latest = yield (0, get_1.getLatest)(t, node1, dateq1);
        t.true(latest.success, 'node1 should get latest');
        t.true(latest.response.contacts.length === 0, 'there should be no contacts');
        t.true(latest.response.chats.length === 0, 'there should be no chats');
        //NODE1 ADDS NODE2 AS A CONTACT
        let added = yield (0, save_1.addContact)(t, node1, node2);
        t.true(added, 'node1 should add node2 as contact');
        //NODE1 GETS LATEST
        let latest2 = yield (0, get_1.getLatest)(t, node1, dateq1);
        t.true(latest2.success, 'node1 should get latest');
        t.true(latest2.response.contacts.length >= 1, 'there should be one contacts');
        t.true(latest2.response.contacts[0].public_key === node2.pubkey, 'node2 should be the latest contact');
        //NODE1 SENDS A TEXT MESSAGE TO NODE2
        const text = (0, helpers_1.randomText)();
        let messageSent = yield (0, msg_1.sendMessageAndCheckDecryption)(t, node1, node2, text);
        //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
        const check = yield (0, msg_1.checkMessageDecryption)(t, node2, messageSent.uuid, text);
        t.true(check, 'node2 should have read and decrypted node1 message');
        yield (0, helpers_1.sleep)(1000);
        //NODE1 GETS LATEST
        let latest3 = yield (0, get_1.getLatest)(t, node2, dateq1);
        t.true(latest3.success, 'node2 should get latest');
        t.true(latest3.response.contacts.length === 1, 'there should be no contacts');
        t.true(latest3.response.chats.length === 1, 'there should be no chats');
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
//# sourceMappingURL=latestTest.test.js.map