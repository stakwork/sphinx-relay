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
const get_1 = require("../utils/get");
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
const rsa = require("../../crypto/rsa");
const crypto = require("crypto");
ava_1.default.serial('hmacTest', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    //   await iterate(nodes, async (node1, node2) => {
    //     await checkContactsWithHmac(t, node1, node2)
    //   })
    yield checkContactsWithHmac(t, nodes_1.default[0], nodes_1.default[1]);
}));
function checkContactsWithHmac(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=> checkContactsWithHmac ${node1.alias} -> ${node2.alias}`);
        // NODE1 ADDS NODE2 AS A CONTACT
        // contact_key should be populated via key exchange in a few seconds
        const key = crypto.randomBytes(20).toString('hex').toLowerCase();
        const success = yield addHmacKey(t, node1, key);
        console.log('HMAC:', success);
        let added = yield addContact(t, node1, node2, key);
        t.true(added, 'node1 should add node2 as contact');
        console.log('added contact!');
        console.log('sent message!');
    });
}
function addHmacKey(t, node1, key) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = {
            encrypted_key: rsa.encrypt(node1.transportToken, key),
        };
        const added = yield http.post(node1.external_ip + '/hmac_key', (0, helpers_1.makeArgs)(node1, body));
        t.true(typeof added.response === 'object', 'add hmac key should return object');
        console.log('ADDED HMAC KEY!');
        return added.response;
    });
}
function addContact(t, node1, node2, key) {
    return __awaiter(this, void 0, void 0, function* () {
        //object of node2node for adding as contact
        const body = {
            alias: `${node2.alias}`,
            public_key: node2.pubkey,
            status: 1,
            route_hint: node2.routeHint || '',
        };
        //node1 adds node2 as contact
        const add = yield http.post(node1.external_ip + '/contacts', (0, helpers_1.makeArgs)(node1, body, {
            hmacOptions: {
                method: 'POSTi',
                path: '/contacts',
                key,
            },
        }));
        t.true(typeof add.response === 'object', 'add contact should return object');
        console.log(add.response);
        //create node2 id based on the post response
        var node2id = add && add.response && add.response.id;
        //check that node2id is a number and therefore exists (contact was posted)
        t.true(typeof node2id === 'number', 'node1id should be a number');
        //await contact_key
        const [n1contactP1, n2contactP1] = yield (0, get_1.getContactAndCheckKeyExchange)(t, node1, node2);
        //make sure node 2 has the contact_key
        t.true(typeof n2contactP1.contact_key === 'string', 'node2 should have a contact key');
        t.true(typeof n1contactP1 === 'object', 'node1 should be its own first contact');
        return true;
    });
}
//# sourceMappingURL=hmac.test.js.map