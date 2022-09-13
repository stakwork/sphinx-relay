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
exports.longMessage = exports.messageLengthTest = void 0;
const ava_1 = require("ava");
const rsa = require("../../crypto/rsa");
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
ava_1.default.serial('test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield messageLengthTest(t, node1, node2);
        yield longMessage(t, node1, node2);
    }));
}));
function messageLengthTest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND PAYMENTS TO EACH OTHER IN A CHAT ===>
        yield (0, del_1.deleteMessages)(t, node2);
        console.log(`${node1.alias} and ${node2.alias}`);
        //NODE1 ADDS NODE2 AS A CONTACT
        const added = yield (0, save_1.addContact)(t, node1, node2);
        t.true(added, 'n1 should add n2 as contact');
        const date = new Date(Date.now());
        const limit = 2;
        const offset = 0;
        yield (0, helpers_1.sleep)(2000);
        //NODE1 SENDS A TEXT MESSAGE TO NODE2
        const text = (0, helpers_1.randomText)();
        yield (0, msg_1.sendMessage)(t, node1, node2, text);
        yield (0, helpers_1.sleep)(1000);
        const text2 = (0, helpers_1.randomText)();
        yield (0, msg_1.sendMessage)(t, node1, node2, text2);
        yield (0, helpers_1.sleep)(1000);
        const text3 = (0, helpers_1.randomText)();
        yield (0, msg_1.sendMessage)(t, node1, node2, text3);
        yield (0, helpers_1.sleep)(1000);
        const text4 = (0, helpers_1.randomText)();
        yield (0, msg_1.sendMessage)(t, node1, node2, text4);
        yield (0, helpers_1.sleep)(1000);
        //t.true(messageSent.success, 'node1 should send text message to node2')
        const newMessagesResponse = yield (0, get_1.getCheckMsgs)(t, node2, date, limit, offset, 'desc');
        t.true(newMessagesResponse.new_messages_total == 4, 'node2 should have 4 new message');
        t.true(decrypt(newMessagesResponse.new_messages[0], node2) == text4, 'first message should be the newest message');
        t.true(decrypt(newMessagesResponse.new_messages[1], node2) == text3, 'first message should be the newest message');
        const newMessagesResponse2 = yield (0, get_1.getCheckAllMessages)(t, node2, limit, offset, 'desc');
        t.true(newMessagesResponse2.new_messages_total == 4, `node2 should have 4 new messages`);
        t.true(decrypt(newMessagesResponse2.new_messages[0], node2) == text4, 'first message should be the newest message');
        t.true(decrypt(newMessagesResponse2.new_messages[1], node2) == text3, 'first message should be the newest message');
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
exports.messageLengthTest = messageLengthTest;
function decrypt(message, node) {
    return rsa.decrypt(node.privkey, message.message_content);
}
function longMessage(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        const limit = 1;
        const offset = 0;
        const added = yield (0, save_1.addContact)(t, node1, node2);
        t.true(added, 'n1 should add n2 as contact');
        //Send the message
        const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Risus feugiat in ante metus dictum at tempor. Ut enim blandit volutpat maecenas volutpat. Velit dignissim sodales ut eu. Eget nunc scelerisque viverra mauris in aliquam sem. Dictum varius duis at consectetur lorem. Maecenas volutpat blandit aliquam etiam erat velit scelerisque. Id velit ut tortor pretium viverra suspendisse potenti. Placerat vestibulum lectus mauris ultrices eros in cursus turpis. Integer vitae justo eget magna. Duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam. Vitae congue mauris rhoncus aenean vel elit scelerisque mauris. Vitae sapien pellentesque habitant morbi tristique. Varius vel pharetra vel turpis nunc eget lorem dolor. Pellentesque massa placerat duis ultricies lacus sed turpis. Augue neque gravida in fermentum et sollicitudin. Adipiscing elit pellentesque habitant morbi tristique.";
        console.log("sending long message to", node2.alias);
        yield (0, msg_1.sendMessage)(t, node1, node2, longText);
        yield (0, helpers_1.sleep)(1000);
        //Checking for the new long message
        const onlyMessage = yield (0, get_1.getCheckAllMessages)(t, node2, limit, offset, 'desc');
        t.true(decrypt(onlyMessage.new_messages[0], node2) == longText, 'reciever should get long message');
        // clean up
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
exports.longMessage = longMessage;
//# sourceMappingURL=messageLength.test.js.map