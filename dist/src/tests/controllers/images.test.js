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
const helpers_1 = require("../utils/helpers");
const base64images_1 = require("../utils/base64images");
const addContact_1 = require("../utils/save/addContact");
const get_1 = require("../utils/get");
const deleteContact_1 = require("../utils/del/deleteContact");
const sendImage_1 = require("../utils/msg/sendImage");
ava_1.default.serial('checkImages', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield imageTest(t, node1, node2);
    }));
}));
function imageTest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND EACH OTHER IMAGES ===>
        console.log(`Testing Sending Image for ${node1.alias} and ${node2.alias}`);
        //NODE1 ADDS NODE2 AS A CONTACT
        const added = yield (0, addContact_1.addContact)(t, node1, node2);
        t.true(added, 'n1 should add n2 as contact');
        //NODE1 SEND IMAGE TO NODE2
        const image = base64images_1.greenSquare;
        const imageSent = yield (0, sendImage_1.sendImage)(t, node1, node2, image);
        t.true(imageSent, 'image should have been sent');
        //NODE2 SENDS AN IMAGE TO NODE1
        const image2 = base64images_1.pinkSquare;
        const imageSent2 = yield (0, sendImage_1.sendImage)(t, node2, node1, image2);
        t.true(imageSent2, 'image should have been sent');
        //NODE1 SEND IMAGE TO NODE2
        const price = 11;
        const paidImageSent = yield (0, sendImage_1.sendImage)(t, node1, node2, image, null, price);
        t.true(paidImageSent, 'paid image should have been sent');
        //NODE2 SENDS AN IMAGE TO NODE1
        const price2 = 12;
        const paidImageSent2 = yield (0, sendImage_1.sendImage)(t, node2, node1, image2, null, price2);
        t.true(paidImageSent2, 'paid image should have been sent');
        //NODE2 SENDS AN IMAGE TO NODE1
        const paidImageSent3 = yield (0, sendImage_1.sendImage)(t, node2, node1, image2, null, undefined, 'thread_uuid');
        t.true(paidImageSent3, 'paid image should have been sent');
        t.true(paidImageSent3.thread_uuid == 'thread_uuid', 'paid image should have been sent');
        //NODE1 AND NODE2 DELETE EACH OTHER AS CONTACTS
        const allContacts = yield (0, get_1.getContacts)(t, node1);
        let deletion;
        for (const contact of allContacts) {
            if (contact.public_key == node2.pubkey) {
                deletion = yield (0, deleteContact_1.deleteContact)(t, node1, contact.id);
                t.true(deletion, 'contacts should be deleted');
            }
        }
    });
}
module.exports = imageTest;
//# sourceMappingURL=images.test.js.map