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
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
const clearAllContacts_test_1 = require("../controllers/clearAllContacts.test");
ava_1.default.serial('test-41-paidMeet: update price_to_meet, add contact paid/unpaid, reset contact', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield helpers_1.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield paidMeet(t, node1, node2);
    }));
}));
function paidMeet(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE2 ADDS NODE1 AS A CONTACT WITH AND WITHOUT PRICE_TO_MEET ===>
        console.log(`${node1.alias} and ${node2.alias}`);
        //NODE1 CHANGES PROFILE ALIAS
        const meetPrice = { price_to_meet: 13 };
        const change = yield save_1.updateProfile(t, node1, meetPrice);
        t.true(change, 'node1 should have changed its price to meet');
        //NODE1 CHECK CONTACT INFO
        const self = yield get_1.getSelf(t, node1);
        t.true(self.price_to_meet === 13, 'node1 should have updated price_to_meet');
        //NODE2 ADDS NODE1 AS A CONTACT
        let added = yield save_1.addContact(t, node2, node1);
        t.true(added, 'node2 should add node1 as contact');
        //NODE2 SENDS A TEXT MESSAGE TO NODE1
        const text = helpers_1.randomText();
        yield msg_1.sendMessageAndCheckDecryption(t, node2, node1, text);
        //GET CONTACTS FROM NODE1, NODE2 WILL NOT BE LISTED
        const contacts = yield http.get(node1.external_ip + '/contacts', helpers_1.makeArgs(node1));
        t.falsy(contacts.response.contacts.find((c) => c.public_key === node2.pubkey), 'node2 will not be listed in contacts');
        //GET CONTACTS FROM NODE1 INCLUDING UNMET, NODE2 WILL BE LISTED
        const contacts2 = yield http.get(node1.external_ip + '/contacts?unmet=include', helpers_1.makeArgs(node1));
        // console.log("contacts2 === ", JSON.stringify(contacts2.response.contacts))
        t.truthy(contacts2.response.contacts.find((c) => c.public_key === node2.pubkey), 'node2 will be listed in unmet contacts');
        //ATTEMPT CONTACT AGAIN
        //NODE2 SENDS A TEXT MESSAGE TO NODE1
        const text2 = helpers_1.randomText();
        const amount = 13;
        yield msg_1.sendMessageAndCheckDecryption(t, node2, node1, text2, { amount });
        //GET CONTACTS FROM NODE1, NODE2 WILL BE LISTED
        const contacts3 = yield http.get(node1.external_ip + '/contacts', helpers_1.makeArgs(node1));
        // console.log("contacts3 === ", JSON.stringify(contacts3.response.contacts))
        t.truthy(contacts3.response.contacts.find((c) => c.public_key === node2.pubkey), 'node2 will be listed in contacts');
        //DELETE ALL CONTACTS
        const clear = yield clearAllContacts_test_1.clearAllContacts(t);
        t.truthy(clear, 'all contacts should be cleared');
        //NODE2 ADDS NODE1 AS A CONTACT WITH CORRECT PRICE TO MEET
        let added3 = yield save_1.addContact(t, node2, node1);
        t.true(added3, 'node2 should add node1 as contact again');
        //NODE2 SENDS A TEXT MESSAGE TO NODE1
        const text3 = helpers_1.randomText();
        const amount2 = 13;
        yield msg_1.sendMessageAndCheckDecryption(t, node2, node1, text3, {
            amount: amount2,
        });
        //GET CONTACTS FROM NODE1, NODE2 WILL BE LISTED
        const contacts5 = yield http.get(node1.external_ip + '/contacts', helpers_1.makeArgs(node1));
        // console.log("contacts5 === ", JSON.stringify(contacts5.response.contacts))
        t.truthy(contacts5.response.contacts.find((c) => c.public_key === node2.pubkey), 'node2 will be listed in contacts');
        //NODE1 RESETS PROFILE
        const meetPrice2 = { price_to_meet: 0 };
        const change2 = yield save_1.updateProfile(t, node1, meetPrice2);
        t.true(change2, 'node1 should have changed its price to meet');
        //NODE1 CHECK CONTACT INFO
        const self2 = yield get_1.getSelf(t, node1);
        t.true(self2.price_to_meet === 0, 'node1 price_to_meet should be reset to 0');
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
//# sourceMappingURL=paidMeet.test.js.map