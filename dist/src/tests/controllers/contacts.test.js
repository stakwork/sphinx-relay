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
const save_1 = require("../utils/save");
const helpers_1 = require("../utils/helpers");
const msg_1 = require("../utils/msg");
ava_1.default.serial('checkContacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield helpers_1.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield checkContact(t, node1, node2);
    }));
}));
function checkContact(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=> checkContact ${node1.alias} -> ${node2.alias}`);
        // NODE1 ADDS NODE2 AS A CONTACT
        // contact_key should be populated via key exchange in a few seconds
        let added = yield save_1.addContact(t, node1, node2);
        t.true(added, 'node1 should add node2 as contact');
        console.log('added contact!');
        const text = helpers_1.randomText();
        let messageSent = yield msg_1.sendMessageAndCheckDecryption(t, node1, node2, text);
        t.truthy(messageSent, 'node1 should send text message to node2');
        console.log('sent message!');
    });
}
//# sourceMappingURL=contacts.test.js.map